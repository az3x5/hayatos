import HabitsTracker from '@/components/habits/HabitsTracker';

export default function HabitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Habits</h1>
        <p className="text-muted-foreground">
          Track your daily habits and build consistent routines
        </p>
      </div>
      
      <HabitsTracker />
    </div>
  );
}
