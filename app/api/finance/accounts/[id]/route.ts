import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for account updates
const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name too long').optional(),
  type: z.enum(['cash', 'checking', 'savings', 'credit', 'investment', 'loan']).optional(),
  currency: z.string().length(3, 'Currency must be 3 characters').optional(),
  credit_limit: z.number().optional(),
  interest_rate: z.number().min(0).max(100).optional(),
  bank_name: z.string().optional(),
  account_number: z.string().optional(),
  routing_number: z.string().optional(),
  is_active: z.boolean().optional(),
  is_hidden: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate account ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Fetch account with recent transactions
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .select(`
        *,
        transactions:transactions(
          id,
          type,
          amount,
          description,
          transaction_date,
          category_id,
          financial_categories(name, color, icon)
        )
      `)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get recent transactions (last 10)
    const { data: recentTransactions } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        description,
        transaction_date,
        is_pending,
        financial_categories(name, color, icon)
      `)
      .eq('account_id', params.id)
      .eq('user_id', session.user.id)
      .order('transaction_date', { ascending: false })
      .limit(10);

    // Calculate account statistics
    const { data: stats } = await supabase
      .rpc('get_account_statistics', {
        account_uuid: params.id,
        user_uuid: session.user.id,
      });

    // Mask sensitive information
    const maskedAccount = {
      ...account,
      account_number: account.account_number ? maskAccountNumber(account.account_number) : null,
      routing_number: account.routing_number ? '****' + account.routing_number.slice(-4) : null,
      recent_transactions: recentTransactions || [],
      statistics: stats?.[0] || {
        total_income: 0,
        total_expenses: 0,
        transaction_count: 0,
        avg_transaction_amount: 0,
      },
    };

    return NextResponse.json({ data: maskedAccount });

  } catch (error) {
    console.error('Error in GET /api/finance/accounts/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate account ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);

    // Check if account exists and user owns it
    const { data: existingAccount, error: fetchError } = await supabase
      .from('financial_accounts')
      .select('id, name')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check for duplicate name if name is being updated
    if (validatedData.name && validatedData.name !== existingAccount.name) {
      const { data: duplicateAccount } = await supabase
        .from('financial_accounts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('name', validatedData.name)
        .neq('id', params.id)
        .single();

      if (duplicateAccount) {
        return NextResponse.json({ error: 'Account name already exists' }, { status: 409 });
      }
    }

    // Update account
    const { data: account, error } = await supabase
      .from('financial_accounts')
      .update(validatedData)
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }

    // Mask sensitive information in response
    const maskedAccount = {
      ...account,
      account_number: account.account_number ? maskAccountNumber(account.account_number) : null,
      routing_number: account.routing_number ? '****' + account.routing_number.slice(-4) : null,
    };

    return NextResponse.json({ data: maskedAccount });

  } catch (error) {
    console.error('Error in PUT /api/finance/accounts/[id]:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate account ID
    if (!z.string().uuid().safeParse(params.id).success) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    // Check if account exists and user owns it
    const { data: existingAccount, error: fetchError } = await supabase
      .from('financial_accounts')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check if account has transactions
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('account_id', params.id)
      .limit(1);

    if (transactionError) {
      console.error('Error checking transactions:', transactionError);
      return NextResponse.json({ error: 'Failed to check account transactions' }, { status: 500 });
    }

    if (transactions && transactions.length > 0) {
      // Don't delete accounts with transactions, just deactivate them
      const { error: deactivateError } = await supabase
        .from('financial_accounts')
        .update({ is_active: false, is_hidden: true })
        .eq('id', params.id)
        .eq('user_id', session.user.id);

      if (deactivateError) {
        console.error('Error deactivating account:', deactivateError);
        return NextResponse.json({ error: 'Failed to deactivate account' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Account deactivated successfully (has existing transactions)' 
      });
    }

    // Delete account if no transactions
    const { error } = await supabase
      .from('financial_accounts')
      .delete()
      .eq('id', params.id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting account:', error);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/finance/accounts/[id]:', error);
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
