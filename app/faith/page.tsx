import FaithDashboard from '@/components/faith/FaithDashboard';

export default function FaithPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Faith</h1>
        <p className="text-muted-foreground">
          Track your Islamic practices and spiritual journey
        </p>
      </div>
      
      <FaithDashboard />
    </div>
  );
}
