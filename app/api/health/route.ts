import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const createHealthLogSchema = z.object({
  type: z.enum(['sleep', 'water', 'exercise', 'diet', 'mood', 'weight', 'blood_pressure', 'heart_rate', 'steps', 'calories']),
  value: z.record(z.any()), // JSONB data structure
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  notes: z.string().optional(),
  source: z.string().default('manual'),
  external_id: z.string().optional(),
});

const querySchema = z.object({
  type: z.enum(['sleep', 'water', 'exercise', 'diet', 'mood', 'weight', 'blood_pressure', 'heart_rate', 'steps', 'calories']).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  source: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
  include_trends: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const url = new URL(request.url);
    const queryParams: Record<string, any> = Object.fromEntries(url.searchParams.entries());

    // Convert parameters
    ['page', 'limit'].forEach(param => {
      if (queryParams[param]) {
        queryParams[param] = parseInt(queryParams[param]);
      }
    });
    
    if (queryParams.include_trends) {
      queryParams.include_trends = queryParams.include_trends === 'true';
    }

    const validatedQuery = querySchema.parse(queryParams);

    // Build query
    let query = supabase
      .from('health_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', session.user.id);

    // Apply filters
    if (validatedQuery.type) {
      query = query.eq('type', validatedQuery.type);
    }

    if (validatedQuery.start_date) {
      query = query.gte('start_time', validatedQuery.start_date);
    }

    if (validatedQuery.end_date) {
      query = query.lte('start_time', validatedQuery.end_date);
    }

    if (validatedQuery.source) {
      query = query.eq('source', validatedQuery.source);
    }

    // Apply pagination
    const offset = (validatedQuery.page - 1) * validatedQuery.limit;
    query = query.range(offset, offset + validatedQuery.limit - 1);

    // Order by start time
    query = query.order('start_time', { ascending: false });

    const { data: healthLogs, error, count } = await query;

    if (error) {
      console.error('Error fetching health logs:', error);
      return NextResponse.json({ error: 'Failed to fetch health logs' }, { status: 500 });
    }

    let response: any = {
      data: healthLogs || [],
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / validatedQuery.limit),
      },
    };

    // Include trends if requested
    if (validatedQuery.include_trends && validatedQuery.type) {
      const startDate = validatedQuery.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = validatedQuery.end_date || new Date().toISOString();

      const { data: trendsData } = await supabase
        .rpc('get_health_trends', {
          user_uuid: session.user.id,
          log_type: validatedQuery.type,
          start_date: startDate.split('T')[0],
          end_date: endDate.split('T')[0],
        });

      response.trends = trendsData || [];
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/health:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createHealthLogSchema.parse(body);

    // Validate value structure based on type
    const validationResult = validateHealthLogValue(validatedData.type, validatedData.value);
    if (!validationResult.isValid) {
      return NextResponse.json({ 
        error: 'Invalid value structure for health log type',
        details: validationResult.errors 
      }, { status: 400 });
    }

    // Create health log
    const { data: healthLog, error } = await supabase
      .from('health_logs')
      .insert({
        ...validatedData,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating health log:', error);
      
      // Handle duplicate external_id error
      if (error.code === '23505' && error.message.includes('external_id')) {
        return NextResponse.json({ error: 'Health log already exists from this source' }, { status: 409 });
      }
      
      return NextResponse.json({ error: 'Failed to create health log' }, { status: 500 });
    }

    return NextResponse.json({ data: healthLog }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/health:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to validate health log value structure
function validateHealthLogValue(type: string, value: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  switch (type) {
    case 'sleep':
      if (!value.hours || typeof value.hours !== 'number' || value.hours < 0 || value.hours > 24) {
        errors.push('Sleep hours must be a number between 0 and 24');
      }
      if (value.quality && (typeof value.quality !== 'number' || value.quality < 1 || value.quality > 5)) {
        errors.push('Sleep quality must be a number between 1 and 5');
      }
      break;

    case 'water':
      if (!value.amount || typeof value.amount !== 'number' || value.amount < 0) {
        errors.push('Water amount must be a positive number');
      }
      if (!value.unit || typeof value.unit !== 'string') {
        errors.push('Water unit is required (e.g., "ml", "oz", "cups")');
      }
      break;

    case 'exercise':
      if (!value.type || typeof value.type !== 'string') {
        errors.push('Exercise type is required');
      }
      if (!value.duration || typeof value.duration !== 'number' || value.duration < 0) {
        errors.push('Exercise duration must be a positive number (minutes)');
      }
      if (value.calories && (typeof value.calories !== 'number' || value.calories < 0)) {
        errors.push('Calories must be a positive number');
      }
      break;

    case 'diet':
      if (!value.meal_type || typeof value.meal_type !== 'string') {
        errors.push('Meal type is required (e.g., "breakfast", "lunch", "dinner", "snack")');
      }
      if (value.calories && (typeof value.calories !== 'number' || value.calories < 0)) {
        errors.push('Calories must be a positive number');
      }
      break;

    case 'mood':
      if (!value.rating || typeof value.rating !== 'number' || value.rating < 1 || value.rating > 5) {
        errors.push('Mood rating must be a number between 1 and 5');
      }
      break;

    case 'weight':
      if (!value.weight || typeof value.weight !== 'number' || value.weight < 0) {
        errors.push('Weight must be a positive number');
      }
      if (!value.unit || typeof value.unit !== 'string') {
        errors.push('Weight unit is required (e.g., "kg", "lbs")');
      }
      break;

    case 'blood_pressure':
      if (!value.systolic || typeof value.systolic !== 'number' || value.systolic < 0) {
        errors.push('Systolic pressure must be a positive number');
      }
      if (!value.diastolic || typeof value.diastolic !== 'number' || value.diastolic < 0) {
        errors.push('Diastolic pressure must be a positive number');
      }
      break;

    case 'heart_rate':
      if (!value.bpm || typeof value.bpm !== 'number' || value.bpm < 0) {
        errors.push('Heart rate (BPM) must be a positive number');
      }
      break;

    case 'steps':
      if (!value.count || typeof value.count !== 'number' || value.count < 0) {
        errors.push('Step count must be a positive number');
      }
      break;

    case 'calories':
      if (!value.amount || typeof value.amount !== 'number' || value.amount < 0) {
        errors.push('Calorie amount must be a positive number');
      }
      break;

    default:
      errors.push('Unknown health log type');
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
