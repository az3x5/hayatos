import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createTransactionSchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  category_id: z.string().uuid('Invalid category ID').optional(),
  type: z.enum(['income', 'expense', 'transfer']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(255, 'Description too long'),
  notes: z.string().optional(),
  transaction_date: z.string().datetime().optional(),
  transfer_account_id: z.string().uuid().optional(),
  recurring_rule: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const querySchema = z.object({
  account_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  type: z.enum(['income', 'expense', 'transfer']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  include_pending: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    // Convert numeric parameters
    ['page', 'limit', 'min_amount', 'max_amount'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseFloat(queryParams[param]);
      }
    });

    if (queryParams.include_pending) {
      queryParams.include_pending = queryParams.include_pending === 'true';
    }

    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('transactions')
      .select(`
        *,
        financial_accounts!inner(name, type, currency),
        financial_categories(name, color, icon),
        transfer_account:financial_accounts!transactions_transfer_account_id_fkey(name, type)
      `, { count: 'exact' })
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.account_id) {
      query = query.eq('account_id', validatedQuery.account_id);
    }

    if (validatedQuery.category_id) {
      query = query.eq('category_id', validatedQuery.category_id);
    }

    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type);
    }

    if (validatedQuery.start_date) {
      query = query.gte('transaction_date', validatedQuery.start_date.split('T')[0]);
    }

    if (validatedQuery.end_date) {
      query = query.lte('transaction_date', validatedQuery.end_date.split('T')[0]);
    }

    if (validatedQuery.min_amount) {
      query = query.gte('amount', validatedQuery.min_amount);
    }

    if (validatedQuery.max_amount) {
      query = query.lte('amount', validatedQuery.max_amount);
    }

    if (!validatedQuery.include_pending) {
      query = query.eq('is_pending', false);
    }

    if (validatedQuery.search) {
      query = query.or(`description.ilike.%${validatedQuery.search}%,notes.ilike.%${validatedQuery.search}%`);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Order by transaction date (newest first)
    query = query.order('transaction_date', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    return NextResponse.json({
      data: transactions || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / validatedQuery.limit),
      },
    });

  } catch (error) {
    console.error('Error in GET /api/finance/transactions:', error);
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
    const validatedData = createTransactionSchema.parse(body);

    // Validate transfer requirements
    if (validatedData.type === 'transfer' && !validatedData.transfer_account_id) {
      return NextResponse.json({ 
        error: 'Transfer account ID is required for transfer transactions' 
      }, { status: 400 });
    }

    if (validatedData.type === 'transfer' && validatedData.account_id === validatedData.transfer_account_id) {
      return NextResponse.json({ 
        error: 'Cannot transfer to the same account' 
      }, { status: 400 });
    }

    // Verify account ownership
    const accountIds = [validatedData.account_id];
    if (validatedData.transfer_account_id) {
      accountIds.push(validatedData.transfer_account_id);
    }

    const { data: accounts, error: accountError } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('user_id', session.user.id)
      .in('id', accountIds);

    if (accountError || !accounts || accounts.length !== accountIds.length) {
      return NextResponse.json({ error: 'Invalid account ID(s)' }, { status: 400 });
    }

    // Set transaction date if not provided
    const transactionDate = validatedData.transaction_date 
      ? new Date(validatedData.transaction_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // Create transaction
    const transactionData = {
      ...validatedData,
      user_id: session.user.id,
      transaction_date: transactionDate,
      posted_date: transactionDate,
    };

    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select(`
        *,
        financial_accounts!inner(name, type, currency),
        financial_categories(name, color, icon),
        transfer_account:financial_accounts!transactions_transfer_account_id_fkey(name, type)
      `)
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // If it's a transfer, create the corresponding transaction in the destination account
    if (validatedData.type === 'transfer' && validatedData.transfer_account_id) {
      const transferTransactionData = {
        user_id: session.user.id,
        account_id: validatedData.transfer_account_id,
        category_id: validatedData.category_id,
        type: 'transfer' as const,
        amount: validatedData.amount,
        description: `Transfer from ${transaction.financial_accounts.name}`,
        notes: validatedData.notes,
        transaction_date: transactionDate,
        posted_date: transactionDate,
        transfer_account_id: validatedData.account_id,
        transfer_transaction_id: transaction.id,
        tags: validatedData.tags,
      };

      const { data: transferTransaction, error: transferError } = await supabase
        .from('transactions')
        .insert(transferTransactionData)
        .select()
        .single();

      if (transferError) {
        console.error('Error creating transfer transaction:', transferError);
        // Rollback the original transaction
        await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id);
        
        return NextResponse.json({ error: 'Failed to create transfer transaction' }, { status: 500 });
      }

      // Update the original transaction with the transfer transaction ID
      await supabase
        .from('transactions')
        .update({ transfer_transaction_id: transferTransaction.id })
        .eq('id', transaction.id);
    }

    return NextResponse.json({ data: transaction }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/finance/transactions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
