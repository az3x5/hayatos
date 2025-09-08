import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for insights query
const insightsQuerySchema = z.object({
  type: z.enum(['overview', 'spending', 'income', 'budgets', 'savings', 'recurring', 'trends']).optional(),
  period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
  months_back: z.number().min(1).max(24).default(12),
  account_ids: z.array(z.string().uuid()).optional(),
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
    
    if (queryParams.months_back) {
      queryParams.months_back = parseInt(queryParams.months_back);
    }
    
    if (queryParams.account_ids) {
      queryParams.account_ids = queryParams.account_ids.split(',');
    }

    const validatedQuery = insightsQuerySchema.parse(queryParams);

    const insights: any = {};

    // Get account balances summary
    const { data: balanceSummary } = await supabase
      .rpc('get_account_balances_summary', {
        user_uuid: session.user.id,
      });

    insights.account_summary = balanceSummary?.[0] || {
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      liquid_assets: 0,
    };

    // Get monthly spending by category
    const { data: monthlySpending } = await supabase
      .rpc('get_monthly_spending_by_category', {
        user_uuid: session.user.id,
      });

    insights.monthly_spending = monthlySpending || [];

    // Get budget progress
    const { data: budgetProgress } = await supabase
      .rpc('get_budget_progress', {
        user_uuid: session.user.id,
      });

    insights.budget_progress = budgetProgress || [];

    // Get monthly cash flow
    const { data: cashFlow } = await supabase
      .rpc('get_monthly_cash_flow', {
        user_uuid: session.user.id,
        months_back: validatedQuery.months_back,
      });

    insights.cash_flow = cashFlow || [];

    // Get savings progress
    const { data: savingsProgress } = await supabase
      .rpc('get_savings_progress', {
        user_uuid: session.user.id,
      });

    insights.savings_progress = savingsProgress || [];

    // Get recurring transactions due
    const { data: recurringDue } = await supabase
      .rpc('get_recurring_transactions_due', {
        user_uuid: session.user.id,
        days_ahead: 30,
      });

    insights.recurring_due = recurringDue || [];

    // Calculate additional insights
    insights.spending_insights = calculateSpendingInsights(monthlySpending || []);
    insights.budget_insights = calculateBudgetInsights(budgetProgress || []);
    insights.cash_flow_insights = calculateCashFlowInsights(cashFlow || []);
    insights.alerts = generateFinancialAlerts(budgetProgress || [], recurringDue || []);

    return NextResponse.json({ data: insights });

  } catch (error) {
    console.error('Error in GET /api/finance/insights:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate spending insights
function calculateSpendingInsights(spendingData: any[]) {
  if (!spendingData.length) {
    return {
      total_spending: 0,
      top_category: null,
      category_count: 0,
      avg_transaction_amount: 0,
    };
  }

  const totalSpending = spendingData.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);
  const topCategory = spendingData[0]; // Already sorted by amount DESC
  const categoryCount = spendingData.length;
  const totalTransactions = spendingData.reduce((sum, item) => sum + item.transaction_count, 0);
  const avgTransactionAmount = totalTransactions > 0 ? totalSpending / totalTransactions : 0;

  return {
    total_spending: totalSpending,
    top_category: topCategory,
    category_count: categoryCount,
    avg_transaction_amount: avgTransactionAmount,
  };
}

// Helper function to calculate budget insights
function calculateBudgetInsights(budgetData: any[]) {
  if (!budgetData.length) {
    return {
      total_budgets: 0,
      over_budget_count: 0,
      total_budgeted: 0,
      total_spent: 0,
      avg_utilization: 0,
    };
  }

  const totalBudgets = budgetData.length;
  const overBudgetCount = budgetData.filter(b => b.is_over_budget).length;
  const totalBudgeted = budgetData.reduce((sum, b) => sum + parseFloat(b.budget_amount), 0);
  const totalSpent = budgetData.reduce((sum, b) => sum + parseFloat(b.spent_amount), 0);
  const avgUtilization = budgetData.reduce((sum, b) => sum + parseFloat(b.percentage_used), 0) / totalBudgets;

  return {
    total_budgets: totalBudgets,
    over_budget_count: overBudgetCount,
    total_budgeted: totalBudgeted,
    total_spent: totalSpent,
    avg_utilization: avgUtilization,
  };
}

// Helper function to calculate cash flow insights
function calculateCashFlowInsights(cashFlowData: any[]) {
  if (!cashFlowData.length) {
    return {
      avg_monthly_income: 0,
      avg_monthly_expenses: 0,
      avg_net_cash_flow: 0,
      positive_months: 0,
      negative_months: 0,
      trend: 'stable',
    };
  }

  const avgIncome = cashFlowData.reduce((sum, m) => sum + parseFloat(m.total_income), 0) / cashFlowData.length;
  const avgExpenses = cashFlowData.reduce((sum, m) => sum + parseFloat(m.total_expenses), 0) / cashFlowData.length;
  const avgNetFlow = cashFlowData.reduce((sum, m) => sum + parseFloat(m.net_cash_flow), 0) / cashFlowData.length;
  
  const positiveMonths = cashFlowData.filter(m => parseFloat(m.net_cash_flow) > 0).length;
  const negativeMonths = cashFlowData.filter(m => parseFloat(m.net_cash_flow) < 0).length;

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(cashFlowData.length / 2);
  const firstHalf = cashFlowData.slice(0, midpoint);
  const secondHalf = cashFlowData.slice(midpoint);
  
  const firstHalfAvg = firstHalf.reduce((sum, m) => sum + parseFloat(m.net_cash_flow), 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, m) => sum + parseFloat(m.net_cash_flow), 0) / secondHalf.length;
  
  let trend = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.1) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg * 0.9) trend = 'declining';

  return {
    avg_monthly_income: avgIncome,
    avg_monthly_expenses: avgExpenses,
    avg_net_cash_flow: avgNetFlow,
    positive_months: positiveMonths,
    negative_months: negativeMonths,
    trend: trend,
  };
}

// Helper function to generate financial alerts
function generateFinancialAlerts(budgetData: any[], recurringData: any[]) {
  const alerts = [];

  // Budget alerts
  budgetData.forEach(budget => {
    if (budget.is_over_budget) {
      alerts.push({
        type: 'budget_exceeded',
        severity: 'high',
        title: 'Budget Exceeded',
        message: `You've exceeded your ${budget.category_name} budget by ${((budget.percentage_used - 100)).toFixed(1)}%`,
        data: budget,
      });
    } else if (budget.percentage_used >= 80) {
      alerts.push({
        type: 'budget_warning',
        severity: 'medium',
        title: 'Budget Warning',
        message: `You've used ${budget.percentage_used.toFixed(1)}% of your ${budget.category_name} budget`,
        data: budget,
      });
    }
  });

  // Recurring payment alerts
  recurringData.forEach(recurring => {
    if (recurring.days_until_due <= 3) {
      alerts.push({
        type: 'payment_due',
        severity: recurring.days_until_due <= 1 ? 'high' : 'medium',
        title: 'Payment Due Soon',
        message: `${recurring.name} (${recurring.amount}) is due in ${recurring.days_until_due} day(s)`,
        data: recurring,
      });
    }
  });

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}
