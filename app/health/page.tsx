import HealthDashboard from '@/components/HealthDashboard';

export default function HealthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Health & Wellness</h1>
        <p className="text-muted-foreground">
          Track your health metrics and achieve your wellness goals
        </p>
      </div>
      
      <HealthDashboard />
    </div>
  );
}
