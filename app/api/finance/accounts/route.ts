import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name too long'),
  type: z.enum(['cash', 'checking', 'savings', 'credit', 'investment', 'loan']),
  currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
  initial_balance: z.number().default(0),
  credit_limit: z.number().optional(),
  interest_rate: z.number().min(0).max(100).optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  routing_number: z.string().optional(),
});

const updateAccountSchema = createAccountSchema.partial().extend({
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

const querySchema = z.object({
  type: z.enum(['cash', 'checking', 'savings', 'credit', 'investment', 'loan']).optional(),
  is_active: z.string().transform(Boolean).optional(),
  include_hidden: z.string().transform(Boolean).default('false'),
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
    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type);
    }

    if (validatedQuery.is_active !== undefined) {
      query = query.eq('is_active', validatedQuery.is_active);
    }

    if (!validatedQuery.include_hidden) {
      query = query.eq('is_hidden', false);
    }

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data: accounts, error } = await query;

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }

    // Mask sensitive information
    const maskedAccounts = (accounts || []).map(account => ({
      ...account,
      account_number: account.account_number ? maskAccountNumber(account.account_number) : null,
      routing_number: account.routing_number ? '****' + account.routing_number.slice(-4) : null,
    }));

    return NextResponse.json({ data: maskedAccounts });

  } catch (error) {
    console.error('Error in GET /api/finance/accounts:', error);
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
    const validatedData = createAccountSchema.parse(body);

    // Check for duplicate account name
    const { data: existingAccount } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('name', validatedData.name)
      .single();

    if (existingAccount) {
      return NextResponse.json({ error: 'Account name already exists' }, { status: 409 });
    }

    // Create account
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .insert({
        ...validatedData,
        user_id: session.user.id,
        current_balance: validatedData.initial_balance,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }

    // Mask sensitive information in response
    const maskedAccount = {
      ...account,
      account_number: account.account_number ? maskAccountNumber(account.account_number) : null,
      routing_number: account.routing_number ? '****' + account.routing_number.slice(-4) : null,
    };

    return NextResponse.json({ data: maskedAccount }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/finance/accounts:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to mask account numbers
function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return '****' + accountNumber.slice(-4);
}
