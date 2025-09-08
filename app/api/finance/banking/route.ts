import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const linkTokenSchema = z.object({
  user_id: z.string().optional(),
  products: z.array(z.enum(['transactions', 'accounts', 'identity', 'assets'])).default(['transactions', 'accounts']),
  country_codes: z.array(z.string()).default(['US']),
  language: z.string().default('en'),
});

const exchangeTokenSchema = z.object({
  public_token: z.string(),
  institution_id: z.string(),
  institution_name: z.string(),
  accounts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    subtype: z.string(),
    mask: z.string().optional(),
  })),
});

const syncTransactionsSchema = z.object({
  integration_id: z.string().uuid(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  account_ids: z.array(z.string()).optional(),
});

// Mock Plaid-like API responses
const MOCK_INSTITUTIONS = [
  {
    institution_id: 'ins_1',
    name: 'Chase Bank',
    products: ['transactions', 'accounts', 'identity'],
    country_codes: ['US'],
    logo: 'https://example.com/chase-logo.png',
  },
  {
    institution_id: 'ins_2',
    name: 'Bank of America',
    products: ['transactions', 'accounts', 'identity'],
    country_codes: ['US'],
    logo: 'https://example.com/boa-logo.png',
  },
  {
    institution_id: 'ins_3',
    name: 'Wells Fargo',
    products: ['transactions', 'accounts', 'identity'],
    country_codes: ['US'],
    logo: 'https://example.com/wells-logo.png',
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create_link_token':
        return handleCreateLinkToken(request, supabase, session.user.id);
      case 'exchange_public_token':
        return handleExchangePublicToken(request, supabase, session.user.id);
      case 'sync_transactions':
        return handleSyncTransactions(request, supabase, session.user.id);
      case 'disconnect':
        return handleDisconnect(request, supabase, session.user.id);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in banking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCreateLinkToken(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = linkTokenSchema.parse(body);

    // In a real implementation, this would call Plaid's /link/token/create endpoint
    const linkToken = `link-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      link_token: linkToken,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });

  } catch (error) {
    console.error('Error creating link token:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}

async function handleExchangePublicToken(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = exchangeTokenSchema.parse(body);

    // In a real implementation, this would call Plaid's /item/public_token/exchange endpoint
    const accessToken = `access-sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const itemId = `item-${Date.now()}`;

    // Store banking integration
    const { data: integration, error: integrationError } = await supabase
      .from('banking_integrations')
      .insert({
        user_id: userId,
        provider: 'plaid',
        institution_id: validatedData.institution_id,
        institution_name: validatedData.institution_name,
        access_token: accessToken, // In production, encrypt this
        item_id: itemId,
        is_active: true,
        sync_status: 'active',
      })
      .select()
      .single();

    if (integrationError) {
      console.error('Error storing integration:', integrationError);
      return NextResponse.json({ error: 'Failed to store integration' }, { status: 500 });
    }

    // Create financial accounts for each linked account
    const accountPromises = validatedData.accounts.map(async (account) => {
      const accountType = mapPlaidAccountType(account.type, account.subtype);
      
      return supabase
        .from('financial_accounts')
        .insert({
          user_id: userId,
          name: account.name,
          type: accountType,
          currency: 'USD',
          initial_balance: 0, // Will be updated during sync
          current_balance: 0,
          account_number: account.mask ? `****${account.mask}` : null,
          external_account_id: account.id,
          last_sync_at: new Date().toISOString(),
        })
        .select()
        .single();
    });

    const accountResults = await Promise.all(accountPromises);
    const createdAccounts = accountResults
      .filter(result => !result.error)
      .map(result => result.data);

    // Perform initial sync
    await performInitialSync(supabase, userId, accessToken, itemId, createdAccounts);

    return NextResponse.json({
      integration_id: integration.id,
      accounts: createdAccounts,
      message: 'Banking integration successful',
    });

  } catch (error) {
    console.error('Error exchanging public token:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}

async function handleSyncTransactions(request: NextRequest, supabase: any, userId: string) {
  try {
    const body = await request.json();
    const validatedData = syncTransactionsSchema.parse(body);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('banking_integrations')
      .select('*')
      .eq('id', validatedData.integration_id)
      .eq('user_id', userId)
      .single();

    if (integrationError || !integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Get linked accounts
    const { data: accounts } = await supabase
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId)
      .not('external_account_id', 'is', null);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: 'No linked accounts found' }, { status: 404 });
    }

    // Perform transaction sync
    const syncResult = await syncTransactionsFromBank(
      supabase,
      userId,
      integration.access_token,
      accounts,
      validatedData.start_date,
      validatedData.end_date
    );

    // Update last sync time
    await supabase
      .from('banking_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration.id);

    return NextResponse.json({
      synced_transactions: syncResult.synced,
      new_transactions: syncResult.new,
      updated_accounts: syncResult.accounts,
      message: 'Transaction sync completed',
    });

  } catch (error) {
    console.error('Error syncing transactions:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 });
  }
}

async function handleDisconnect(request: NextRequest, supabase: any, userId: string) {
  try {
    const { integration_id } = await request.json();

    if (!integration_id) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
    }

    // Deactivate integration
    const { error } = await supabase
      .from('banking_integrations')
      .update({ 
        is_active: false,
        sync_status: 'disconnected',
      })
      .eq('id', integration_id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error disconnecting integration:', error);
      return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Banking integration disconnected' });

  } catch (error) {
    console.error('Error in disconnect:', error);
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}

// Helper function to map Plaid account types to our account types
function mapPlaidAccountType(type: string, subtype: string): string {
  const typeMap: Record<string, string> = {
    'depository.checking': 'checking',
    'depository.savings': 'savings',
    'credit.credit_card': 'credit',
    'loan.mortgage': 'loan',
    'loan.student': 'loan',
    'investment.401k': 'investment',
    'investment.ira': 'investment',
    'investment.brokerage': 'investment',
  };

  const key = `${type}.${subtype}`;
  return typeMap[key] || 'checking';
}

// Helper function to perform initial sync
async function performInitialSync(
  supabase: any,
  userId: string,
  accessToken: string,
  itemId: string,
  accounts: any[]
) {
  // Mock account balances and recent transactions
  for (const account of accounts) {
    const mockBalance = Math.random() * 10000;
    
    // Update account balance
    await supabase
      .from('financial_accounts')
      .update({ 
        current_balance: mockBalance,
        initial_balance: mockBalance,
      })
      .eq('id', account.id);

    // Create some mock transactions
    const mockTransactions = generateMockTransactions(account.id, userId);
    
    for (const transaction of mockTransactions) {
      await supabase
        .from('transactions')
        .insert(transaction);
    }
  }
}

// Helper function to sync transactions from bank
async function syncTransactionsFromBank(
  supabase: any,
  userId: string,
  accessToken: string,
  accounts: any[],
  startDate?: string,
  endDate?: string
) {
  let synced = 0;
  let newTransactions = 0;
  const updatedAccounts = [];

  for (const account of accounts) {
    // Mock new transactions
    const mockTransactions = generateMockTransactions(account.id, userId, 5);
    
    for (const transaction of mockTransactions) {
      // Check if transaction already exists
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('external_transaction_id', transaction.external_transaction_id)
        .single();

      if (!existing) {
        await supabase
          .from('transactions')
          .insert(transaction);
        newTransactions++;
      }
      synced++;
    }

    updatedAccounts.push(account.id);
  }

  return { synced, new: newTransactions, accounts: updatedAccounts };
}

// Helper function to generate mock transactions
function generateMockTransactions(accountId: string, userId: string, count = 10) {
  const mockCategories = [
    { name: 'Groceries', type: 'expense' },
    { name: 'Gas', type: 'expense' },
    { name: 'Restaurant', type: 'expense' },
    { name: 'Salary', type: 'income' },
    { name: 'Shopping', type: 'expense' },
  ];

  const transactions = [];
  
  for (let i = 0; i < count; i++) {
    const category = mockCategories[Math.floor(Math.random() * mockCategories.length)];
    const amount = category.type === 'income' 
      ? Math.random() * 3000 + 1000 
      : Math.random() * 200 + 10;
    
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));

    transactions.push({
      user_id: userId,
      account_id: accountId,
      type: category.type,
      amount: Math.round(amount * 100) / 100,
      description: `${category.name} transaction`,
      transaction_date: date.toISOString().split('T')[0],
      posted_date: date.toISOString().split('T')[0],
      external_transaction_id: `plaid_${Date.now()}_${i}`,
      external_source: 'plaid',
      is_pending: Math.random() < 0.1, // 10% chance of being pending
    });
  }

  return transactions;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'institutions') {
      return NextResponse.json({ institutions: MOCK_INSTITUTIONS });
    }

    if (action === 'integrations') {
      // Get user's banking integrations
      const { data: integrations, error } = await supabase
        .from('banking_integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching integrations:', error);
        return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
      }

      return NextResponse.json({ integrations: integrations || [] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in GET banking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
