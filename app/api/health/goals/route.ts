import { createSupabaseRouteHandlerClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createHealthGoalSchema = z.object({
  type: z.enum(['sleep', 'water', 'exercise', 'diet', 'mood', 'weight', 'blood_pressure', 'heart_rate', 'steps', 'calories']),
  target_value: z.record(z.any()), // JSONB data structure
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
});

const updateHealthGoalSchema = z.object({
  target_value: z.record(z.any()).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const isActive = url.searchParams.get('is_active');

    // Build query
    let query = supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', session.user.id);

    if (type) {
      query = query.eq('type', type);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    query = query.order('created_at', { ascending: false });

    const { data: healthGoals, error } = await query;

    if (error) {
      console.error('Error fetching health goals:', error);
      return NextResponse.json({ error: 'Failed to fetch health goals' }, { status: 500 });
    }

    // Get progress for each goal
    const enrichedGoals = await Promise.all(
      (healthGoals || []).map(async (goal) => {
        const progress = await calculateGoalProgress(supabase, session.user.id, goal);
        return {
          ...goal,
          progress,
        };
      })
    );

    return NextResponse.json({ data: enrichedGoals });

  } catch (error) {
    console.error('Error in GET /api/health/goals:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createHealthGoalSchema.parse(body);

    // Validate target value structure
    const validationResult = validateGoalTargetValue(validatedData.type, validatedData.target_value);
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: 'Invalid target value structure for health goal type',
        details: validationResult.errors 
      }, { status: 400 });
    }

    // Deactivate existing goal of the same type
    await supabase
      .from('health_goals')
      .update({ is_active: false })
      .eq('user_id', session.user.id)
      .eq('type', validatedData.type)
      .eq('is_active', true);

    // Create new health goal
    const { data: healthGoal, error } = await supabase
      .from('health_goals')
      .insert({
        ...validatedData,
        user_id: session.user.id,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating health goal:', error);
      return NextResponse.json({ error: 'Failed to create health goal' }, { status: 500 });
    }

    return NextResponse.json({ data: healthGoal }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/health/goals:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to validate goal target value structure
function validateGoalTargetValue(type: string, targetValue: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'sleep':
      if (!targetValue.hours || typeof targetValue.hours !== 'number' || targetValue.hours < 0 || targetValue.hours > 24) {
        errors.push('Sleep target hours must be a number between 0 and 24');
      }
      break;

    case 'water':
      if (!targetValue.amount || typeof targetValue.amount !== 'number' || targetValue.amount < 0) {
        errors.push('Water target amount must be a positive number');
      }
      if (!targetValue.unit || typeof targetValue.unit !== 'string') {
        errors.push('Water target unit is required');
      }
      break;

    case 'exercise':
      if (!targetValue.duration || typeof targetValue.duration !== 'number' || targetValue.duration < 0) {
        errors.push('Exercise target duration must be a positive number (minutes)');
      }
      break;

    case 'steps':
      if (!targetValue.count || typeof targetValue.count !== 'number' || targetValue.count < 0) {
        errors.push('Steps target count must be a positive number');
      }
      break;

    case 'weight':
      if (!targetValue.weight || typeof targetValue.weight !== 'number' || targetValue.weight < 0) {
        errors.push('Weight target must be a positive number');
      }
      if (!targetValue.unit || typeof targetValue.unit !== 'string') {
        errors.push('Weight target unit is required');
      }
      break;

    case 'calories':
      if (!targetValue.amount || typeof targetValue.amount !== 'number' || targetValue.amount < 0) {
        errors.push('Calorie target amount must be a positive number');
      }
      break;

    default:
      // For other types, allow flexible structure
      break;
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

// Helper function to calculate goal progress
async function calculateGoalProgress(supabase: any, userId: string, goal: any) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  // Calculate date range based on goal period
  switch (goal.period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Get health logs for the period
  const { data: logs } = await supabase
    .from('health_logs')
    .select('value, start_time')
    .eq('user_id', userId)
    .eq('type', goal.type)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString());

  if (!logs || logs.length === 0) {
    return {
      current_value: 0,
      target_value: goal.target_value,
      percentage: 0,
      is_achieved: false,
    };
  }

  // Calculate current value based on goal type
  let currentValue = 0;
  
  switch (goal.type) {
    case 'sleep':
      // Average sleep hours
      const totalHours = logs.reduce((sum: number, log: any) => sum + (log.value.hours || 0), 0);
      currentValue = totalHours / logs.length;
      break;
    
    case 'water':
    case 'calories':
      // Sum amounts (convert to same unit if needed)
      currentValue = logs.reduce((sum: number, log: any) => sum + (log.value.amount || 0), 0);
      break;

    case 'exercise':
      // Sum duration
      currentValue = logs.reduce((sum: number, log: any) => sum + (log.value.duration || 0), 0);
      break;

    case 'steps':
      // Sum step counts
      currentValue = logs.reduce((sum: number, log: any) => sum + (log.value.count || 0), 0);
      break;
    
    case 'weight':
      // Latest weight
      const sortedLogs = logs.sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      currentValue = sortedLogs[0]?.value.weight || 0;
      break;
    
    default:
      currentValue = logs.length; // Count of logs
  }

  // Calculate target value for comparison
  const targetValue = getTargetValueForComparison(goal.type, goal.target_value);
  const percentage = targetValue > 0 ? Math.min((currentValue / targetValue) * 100, 100) : 0;
  const isAchieved = currentValue >= targetValue;

  return {
    current_value: currentValue,
    target_value: goal.target_value,
    percentage: Math.round(percentage),
    is_achieved: isAchieved,
    period_start: startDate.toISOString(),
    period_end: endDate.toISOString(),
  };
}

// Helper function to extract comparable target value
function getTargetValueForComparison(type: string, targetValue: any): number {
  switch (type) {
    case 'sleep':
      return targetValue.hours || 0;
    case 'water':
    case 'calories':
      return targetValue.amount || 0;
    case 'exercise':
      return targetValue.duration || 0;
    case 'steps':
      return targetValue.count || 0;
    case 'weight':
      return targetValue.weight || 0;
    default:
      return 1; // Default target for count-based goals
  }
}
