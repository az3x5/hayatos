-- Finance Module Database Functions

-- Function to update account balance after transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT
    IF TG_OP = 'INSERT' THEN
        -- Update account balance based on transaction type
        IF NEW.type = 'income' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            -- Subtract from source account
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id;
            -- Add to destination account
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.transfer_account_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle UPDATE
    IF TG_OP = 'UPDATE' THEN
        -- Reverse old transaction
        IF OLD.type = 'income' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.transfer_account_id;
        END IF;

        -- Apply new transaction
        IF NEW.type = 'income' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id;
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.transfer_account_id;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle DELETE
    IF TG_OP = 'DELETE' THEN
        -- Reverse the transaction
        IF OLD.type = 'income' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.financial_accounts 
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id;
            UPDATE public.financial_accounts 
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.transfer_account_id;
        END IF;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for account balance updates
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Function to get monthly spending by category
CREATE OR REPLACE FUNCTION public.get_monthly_spending_by_category(
    user_uuid UUID,
    start_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE,
    end_date DATE DEFAULT (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE
)
RETURNS TABLE (
    category_id UUID,
    category_name TEXT,
    category_color TEXT,
    total_amount DECIMAL,
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(t.category_id, '00000000-0000-0000-0000-000000000000'::UUID) as category_id,
        COALESCE(c.name, 'Uncategorized') as category_name,
        COALESCE(c.color, '#6B7280') as category_color,
        SUM(t.amount) as total_amount,
        COUNT(*)::INTEGER as transaction_count
    FROM public.transactions t
    LEFT JOIN public.financial_categories c ON t.category_id = c.id
    WHERE t.user_id = user_uuid
        AND t.type = 'expense'
        AND t.transaction_date BETWEEN start_date AND end_date
        AND NOT t.is_pending
    GROUP BY t.category_id, c.name, c.color
    ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get budget progress
CREATE OR REPLACE FUNCTION public.get_budget_progress(
    user_uuid UUID,
    budget_period_start DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE)::DATE
)
RETURNS TABLE (
    budget_id UUID,
    budget_name TEXT,
    category_name TEXT,
    budget_amount DECIMAL,
    spent_amount DECIMAL,
    remaining_amount DECIMAL,
    percentage_used DECIMAL,
    is_over_budget BOOLEAN,
    days_remaining INTEGER
) AS $$
DECLARE
    period_end DATE;
BEGIN
    -- Calculate period end based on budget period
    period_end := budget_period_start + INTERVAL '1 month' - INTERVAL '1 day';

    RETURN QUERY
    WITH budget_spending AS (
        SELECT 
            b.id as budget_id,
            b.name as budget_name,
            c.name as category_name,
            b.amount as budget_amount,
            COALESCE(SUM(t.amount), 0) as spent_amount
        FROM public.budgets b
        LEFT JOIN public.financial_categories c ON b.category_id = c.id
        LEFT JOIN public.transactions t ON (
            t.category_id = b.category_id 
            AND t.user_id = user_uuid
            AND t.type = 'expense'
            AND t.transaction_date BETWEEN budget_period_start AND period_end
            AND NOT t.is_pending
            AND (
                array_length(b.tracked_accounts, 1) IS NULL OR 
                t.account_id = ANY(b.tracked_accounts)
            )
        )
        WHERE b.user_id = user_uuid
            AND b.is_active = true
            AND budget_period_start BETWEEN b.start_date AND COALESCE(b.end_date, '2099-12-31'::DATE)
        GROUP BY b.id, b.name, c.name, b.amount
    )
    SELECT 
        bs.budget_id,
        bs.budget_name,
        bs.category_name,
        bs.budget_amount,
        bs.spent_amount,
        (bs.budget_amount - bs.spent_amount) as remaining_amount,
        CASE 
            WHEN bs.budget_amount > 0 THEN (bs.spent_amount / bs.budget_amount * 100)
            ELSE 0
        END as percentage_used,
        (bs.spent_amount > bs.budget_amount) as is_over_budget,
        (period_end - CURRENT_DATE)::INTEGER as days_remaining
    FROM budget_spending bs
    ORDER BY percentage_used DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get account balances summary
CREATE OR REPLACE FUNCTION public.get_account_balances_summary(user_uuid UUID)
RETURNS TABLE (
    total_assets DECIMAL,
    total_liabilities DECIMAL,
    net_worth DECIMAL,
    liquid_assets DECIMAL,
    account_breakdown JSONB
) AS $$
DECLARE
    assets DECIMAL := 0;
    liabilities DECIMAL := 0;
    liquid DECIMAL := 0;
    breakdown JSONB;
BEGIN
    -- Calculate totals and breakdown
    SELECT 
        COALESCE(SUM(CASE WHEN type IN ('cash', 'checking', 'savings', 'investment') THEN current_balance ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type IN ('credit', 'loan') THEN ABS(current_balance) ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN type IN ('cash', 'checking', 'savings') THEN current_balance ELSE 0 END), 0),
        jsonb_agg(
            jsonb_build_object(
                'account_id', id,
                'name', name,
                'type', type,
                'balance', current_balance,
                'currency', currency
            )
        )
    INTO assets, liabilities, liquid, breakdown
    FROM public.financial_accounts
    WHERE user_id = user_uuid AND is_active = true;

    RETURN QUERY SELECT 
        assets as total_assets,
        liabilities as total_liabilities,
        (assets - liabilities) as net_worth,
        liquid as liquid_assets,
        breakdown as account_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recurring transactions due
CREATE OR REPLACE FUNCTION public.get_recurring_transactions_due(
    user_uuid UUID,
    days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
    recurring_id UUID,
    name TEXT,
    amount DECIMAL,
    type transaction_type,
    next_due_date DATE,
    days_until_due INTEGER,
    account_name TEXT,
    category_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rt.id as recurring_id,
        rt.name,
        rt.amount,
        rt.type,
        rt.next_due_date,
        (rt.next_due_date - CURRENT_DATE)::INTEGER as days_until_due,
        fa.name as account_name,
        fc.name as category_name
    FROM public.recurring_transactions rt
    LEFT JOIN public.financial_accounts fa ON rt.account_id = fa.id
    LEFT JOIN public.financial_categories fc ON rt.category_id = fc.id
    WHERE rt.user_id = user_uuid
        AND rt.is_active = true
        AND rt.next_due_date <= (CURRENT_DATE + days_ahead)
    ORDER BY rt.next_due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly cash flow
CREATE OR REPLACE FUNCTION public.get_monthly_cash_flow(
    user_uuid UUID,
    months_back INTEGER DEFAULT 12
)
RETURNS TABLE (
    month_year TEXT,
    month_date DATE,
    total_income DECIMAL,
    total_expenses DECIMAL,
    net_cash_flow DECIMAL,
    transaction_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', t.transaction_date)::DATE as month_date,
            SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as income,
            SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as expenses,
            COUNT(*) as tx_count
        FROM public.transactions t
        WHERE t.user_id = user_uuid
            AND t.transaction_date >= (DATE_TRUNC('month', CURRENT_DATE) - (months_back || ' months')::INTERVAL)::DATE
            AND NOT t.is_pending
            AND t.type IN ('income', 'expense')
        GROUP BY DATE_TRUNC('month', t.transaction_date)
    )
    SELECT 
        TO_CHAR(md.month_date, 'Mon YYYY') as month_year,
        md.month_date,
        md.income as total_income,
        md.expenses as total_expenses,
        (md.income - md.expenses) as net_cash_flow,
        md.tx_count::INTEGER as transaction_count
    FROM monthly_data md
    ORDER BY md.month_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get savings progress
CREATE OR REPLACE FUNCTION public.get_savings_progress(user_uuid UUID)
RETURNS TABLE (
    goal_id UUID,
    goal_name TEXT,
    target_amount DECIMAL,
    current_amount DECIMAL,
    progress_percentage DECIMAL,
    target_date DATE,
    days_remaining INTEGER,
    monthly_target DECIMAL,
    is_on_track BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fg.id as goal_id,
        fg.name as goal_name,
        fg.target_amount,
        fg.current_amount,
        CASE 
            WHEN fg.target_amount > 0 THEN (fg.current_amount / fg.target_amount * 100)
            ELSE 0
        END as progress_percentage,
        fg.target_date,
        CASE 
            WHEN fg.target_date IS NOT NULL THEN (fg.target_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END as days_remaining,
        CASE 
            WHEN fg.target_date IS NOT NULL AND fg.target_date > CURRENT_DATE THEN
                (fg.target_amount - fg.current_amount) / 
                GREATEST(1, EXTRACT(EPOCH FROM (fg.target_date - CURRENT_DATE)) / (30.44 * 24 * 3600))
            ELSE NULL
        END as monthly_target,
        CASE 
            WHEN fg.target_date IS NULL THEN true
            WHEN fg.target_date <= CURRENT_DATE THEN (fg.current_amount >= fg.target_amount)
            ELSE (
                fg.current_amount / GREATEST(1, EXTRACT(EPOCH FROM (CURRENT_DATE - fg.created_at::DATE)) / (30.44 * 24 * 3600)) >=
                fg.target_amount / GREATEST(1, EXTRACT(EPOCH FROM (fg.target_date - fg.created_at::DATE)) / (30.44 * 24 * 3600))
            )
        END as is_on_track
    FROM public.financial_goals fg
    WHERE fg.user_id = user_uuid AND fg.is_active = true
    ORDER BY fg.target_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
