-- Finance Module Database Schema

-- Create custom types for finance
CREATE TYPE account_type AS ENUM ('cash', 'checking', 'savings', 'credit', 'investment', 'loan');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE recurring_frequency AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly');

-- Financial categories table
CREATE TABLE public.financial_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT '💰',
    parent_category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    is_system BOOLEAN DEFAULT FALSE, -- System categories vs user-created
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name, type)
);

-- Financial accounts table
CREATE TABLE public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type account_type NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    initial_balance DECIMAL(15,2) DEFAULT 0.00,
    current_balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2), -- For credit accounts
    interest_rate DECIMAL(5,4), -- Annual interest rate
    bank_name TEXT,
    account_number TEXT, -- Encrypted/masked
    routing_number TEXT, -- Encrypted
    is_active BOOLEAN DEFAULT TRUE,
    is_hidden BOOLEAN DEFAULT FALSE,
    external_account_id TEXT, -- For banking integrations
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, name)
);

-- Transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    transaction_date DATE NOT NULL,
    posted_date DATE,
    
    -- Transfer fields
    transfer_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    transfer_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- Recurring transaction fields
    recurring_rule TEXT, -- RFC 5545 RRULE format
    parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    
    -- External integration fields
    external_transaction_id TEXT,
    external_source TEXT, -- plaid, yodlee, etc.
    
    -- Status and metadata
    is_pending BOOLEAN DEFAULT FALSE,
    is_reconciled BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure transfer transactions are paired
    CONSTRAINT valid_transfer CHECK (
        (type != 'transfer') OR 
        (type = 'transfer' AND transfer_account_id IS NOT NULL)
    )
);

-- Budgets table
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    period budget_period NOT NULL DEFAULT 'monthly',
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Account tracking
    tracked_accounts UUID[] DEFAULT '{}', -- Array of account IDs
    
    -- Alert settings
    alert_percentage DECIMAL(5,2) DEFAULT 80.00, -- Alert when 80% spent
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category_id, start_date, period)
);

-- Recurring transactions template
CREATE TABLE public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT NOT NULL,
    
    -- Recurrence settings
    frequency recurring_frequency NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    
    -- Transfer settings
    transfer_account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    
    is_active BOOLEAN DEFAULT TRUE,
    auto_create BOOLEAN DEFAULT FALSE, -- Automatically create transactions
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial goals table
CREATE TABLE public.financial_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0.00,
    target_date DATE,
    
    -- Goal type and settings
    goal_type TEXT NOT NULL, -- savings, debt_payoff, investment, etc.
    tracked_accounts UUID[] DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Banking integrations table
CREATE TABLE public.banking_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- plaid, yodlee, etc.
    institution_id TEXT NOT NULL,
    institution_name TEXT NOT NULL,
    
    access_token TEXT, -- Encrypted
    item_id TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'active', -- active, error, requires_update
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, provider, item_id)
);

-- Create indexes for better performance
CREATE INDEX idx_financial_categories_user_id ON public.financial_categories(user_id);
CREATE INDEX idx_financial_categories_type ON public.financial_categories(type);
CREATE INDEX idx_financial_categories_parent ON public.financial_categories(parent_category_id);

CREATE INDEX idx_financial_accounts_user_id ON public.financial_accounts(user_id);
CREATE INDEX idx_financial_accounts_type ON public.financial_accounts(type);
CREATE INDEX idx_financial_accounts_active ON public.financial_accounts(is_active);

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_amount ON public.transactions(amount);
CREATE INDEX idx_transactions_external ON public.transactions(external_transaction_id, external_source);

CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_category_id ON public.budgets(category_id);
CREATE INDEX idx_budgets_period ON public.budgets(start_date, end_date);
CREATE INDEX idx_budgets_active ON public.budgets(is_active);

CREATE INDEX idx_recurring_transactions_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_transactions_next_due ON public.recurring_transactions(next_due_date);
CREATE INDEX idx_recurring_transactions_active ON public.recurring_transactions(is_active);

CREATE INDEX idx_financial_goals_user_id ON public.financial_goals(user_id);
CREATE INDEX idx_financial_goals_active ON public.financial_goals(is_active);

CREATE INDEX idx_banking_integrations_user_id ON public.banking_integrations(user_id);
CREATE INDEX idx_banking_integrations_provider ON public.banking_integrations(provider);

-- Add RLS policies
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_integrations ENABLE ROW LEVEL SECURITY;

-- Financial categories policies
CREATE POLICY "Users can manage own financial categories" ON public.financial_categories
    FOR ALL USING (auth.uid() = user_id);

-- Financial accounts policies
CREATE POLICY "Users can manage own financial accounts" ON public.financial_accounts
    FOR ALL USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can manage own transactions" ON public.transactions
    FOR ALL USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can manage own budgets" ON public.budgets
    FOR ALL USING (auth.uid() = user_id);

-- Recurring transactions policies
CREATE POLICY "Users can manage own recurring transactions" ON public.recurring_transactions
    FOR ALL USING (auth.uid() = user_id);

-- Financial goals policies
CREATE POLICY "Users can manage own financial goals" ON public.financial_goals
    FOR ALL USING (auth.uid() = user_id);

-- Banking integrations policies
CREATE POLICY "Users can manage own banking integrations" ON public.banking_integrations
    FOR ALL USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_financial_categories_updated_at BEFORE UPDATE ON public.financial_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_accounts_updated_at BEFORE UPDATE ON public.financial_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_transactions_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_financial_goals_updated_at BEFORE UPDATE ON public.financial_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_banking_integrations_updated_at BEFORE UPDATE ON public.banking_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
