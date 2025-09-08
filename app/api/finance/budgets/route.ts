import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createBudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100, 'Name too long'),
  category_id: z.string().uuid('Invalid category ID'),
  amount: z.number().positive('Budget amount must be positive'),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  tracked_accounts: z.array(z.string().uuid()).default([]),
  alert_percentage: z.number().min(0).max(100).default(80),
});

const updateBudgetSchema = createBudgetSchema.partial().extend({
  is_active: z.boolean().optional(),
});

const querySchema = z.object({
  category_id: z.string().uuid().optional(),
  period: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']).optional(),
  is_active: z.string().transform(Boolean).optional(),
  include_progress: z.string().transform(Boolean).default('true'),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    if (queryParams.include_progress) {
      queryParams.include_progress = queryParams.include_progress === 'true';
    }

    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('budgets')
      .select(`
        *,
        financial_categories(name, color, icon, type)
      `)
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.category_id) {
      query = query.eq('category_id', validatedQuery.category_id);
    }

    if (validatedQuery.period) {
      query = query.eq('period', validatedQuery.period);
    }

    if (validatedQuery.is_active !== undefined) {
      query = query.eq('is_active', validatedQuery.is_active);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: budgets, error } = await query;

    if (error) {
      console.error('Error fetching budgets:', error);
      return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 });
    }

    // Include progress if requested
    let enrichedBudgets = budgets || [];
    if (validatedQuery.include_progress) {
      const { data: progressData } = await supabase
        .rpc('get_budget_progress', {
          user_uuid: session.user.id,
        });

      enrichedBudgets = (budgets || []).map(budget => {
        const progress = progressData?.find(p => p.budget_id === budget.id);
        return {
          ...budget,
          progress: progress || {
            spent_amount: 0,
            remaining_amount: budget.amount,
            percentage_used: 0,
            is_over_budget: false,
            days_remaining: 30,
          },
        };
      });
    }

    return NextResponse.json({ data: enrichedBudgets });

  } catch (error) {
    console.error('Error in GET /api/finance/budgets:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBudgetSchema.parse(body);

    // Verify category exists and belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('financial_categories')
      .select('id, name, type')
      .eq('id', validatedData.category_id)
      .eq('user_id', session.user.id)
      .single();

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    // Verify tracked accounts belong to user
    if (validatedData.tracked_accounts.length > 0) {
      const { data: accounts, error: accountError } = await supabase
        .from('financial_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .in('id', validatedData.tracked_accounts);

      if (accountError || !accounts || accounts.length !== validatedData.tracked_accounts.length) {
        return NextResponse.json({ error: 'Invalid tracked account ID(s)' }, { status: 400 });
      }
    }

    // Set start date if not provided
    const startDate = validatedData.start_date 
      ? new Date(validatedData.start_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Calculate end date based on period if not provided
    let endDate = validatedData.end_date 
      ? new Date(validatedData.end_date).toISOString().split('T')[0]
      : null;

    if (!endDate) {
      const start = new Date(startDate);
      switch (validatedData.period) {
        case 'weekly':
          start.setDate(start.getDate() + 7);
          break;
        case 'monthly':
          start.setMonth(start.getMonth() + 1);
          break;
        case 'quarterly':
          start.setMonth(start.getMonth() + 3);
          break;
        case 'yearly':
          start.setFullYear(start.getFullYear() + 1);
          break;
      }
      endDate = start.toISOString().split('T')[0];
    }

    // Check for overlapping budgets for the same category
    const { data: existingBudget } = await supabase
      .from('budgets')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('category_id', validatedData.category_id)
      .eq('period', validatedData.period)
      .eq('is_active', true)
      .gte('end_date', startDate)
      .lte('start_date', endDate)
      .single();

    if (existingBudget) {
      return NextResponse.json({ 
        error: 'A budget for this category and period already exists' 
      }, { status: 409 });
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        ...validatedData,
        user_id: session.user.id,
        start_date: startDate,
        end_date: endDate,
      })
      .select(`
        *,
        financial_categories(name, color, icon, type)
      `)
      .single();

    if (error) {
      console.error('Error creating budget:', error);
      return NextResponse.json({ error: 'Failed to create budget' }, { status: 500 });
    }

    return NextResponse.json({ data: budget }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/finance/budgets:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
