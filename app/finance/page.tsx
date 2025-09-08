import FinanceOverview from '@/components/finance/FinanceOverview';

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Finance</h1>
        <p className="text-muted-foreground">
          Track your income, expenses, and budgets
        </p>
      </div>

      <FinanceOverview />
    </div>
  );
}
