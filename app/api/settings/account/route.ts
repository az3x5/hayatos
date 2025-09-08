import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const accountDeletionSchema = z.object({
  reason: z.string().max(500).optional(),
  feedback: z.string().max(1000).optional(),
  delete_immediately: z.boolean().default(false),
  export_data_before_deletion: z.boolean().default(true),
  anonymize_data: z.boolean().default(false),
  confirm_deletion: z.boolean().refine(val => val === true, {
    message: "You must confirm the deletion"
  }),
});

const passwordChangeSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
  confirm_password: z.string().min(8).max(128),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

const emailChangeSchema = z.object({
  new_email: z.string().email(),
  password: z.string().min(1),
});

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

    if (action === 'deletion_status') {
      return handleGetDeletionStatus(supabase, session.user.id);
    }

    if (action === 'security_info') {
      return handleGetSecurityInfo(supabase, session.user);
    }

    if (action === 'data_summary') {
      return handleGetDataSummary(supabase, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in GET /api/settings/account:', error);
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

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'request_deletion') {
      return handleRequestDeletion(supabase, request, session.user.id);
    }

    if (action === 'cancel_deletion') {
      return handleCancelDeletion(supabase, session.user.id);
    }

    if (action === 'change_password') {
      return handleChangePassword(supabase, request, session.user);
    }

    if (action === 'change_email') {
      return handleChangeEmail(supabase, request, session.user);
    }

    if (action === 'enable_2fa') {
      return handleEnable2FA(supabase, session.user.id);
    }

    if (action === 'disable_2fa') {
      return handleDisable2FA(supabase, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings/account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetDeletionStatus(supabase: any, userId: string) {
  const { data: deletion, error } = await supabase
    .from('account_deletions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('requested_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching deletion status:', error);
    return NextResponse.json({ error: 'Failed to fetch deletion status' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: deletion ? {
      has_pending_deletion: true,
      scheduled_date: deletion.scheduled_deletion_date,
      reason: deletion.reason,
      export_data: deletion.export_data_before_deletion,
      requested_at: deletion.requested_at
    } : {
      has_pending_deletion: false
    }
  });
}

async function handleGetSecurityInfo(supabase: any, user: any) {
  // Get privacy settings
  const { data: privacy } = await supabase
    .from('privacy_settings')
    .select('two_factor_enabled, login_notifications, session_timeout')
    .eq('user_id', user.id)
    .single();

  // Get recent login activity (this would come from auth logs in production)
  const securityInfo = {
    email: user.email,
    email_confirmed: user.email_confirmed_at ? true : false,
    phone: user.phone,
    phone_confirmed: user.phone_confirmed_at ? true : false,
    two_factor_enabled: privacy?.two_factor_enabled || false,
    login_notifications: privacy?.login_notifications || true,
    session_timeout: privacy?.session_timeout || 30,
    last_sign_in: user.last_sign_in_at,
    created_at: user.created_at,
    recent_logins: [
      // This would be populated from actual auth logs
      {
        timestamp: new Date().toISOString(),
        ip_address: '192.168.1.1',
        user_agent: 'Chrome/91.0',
        location: 'Unknown'
      }
    ]
  };

  return NextResponse.json({ data: securityInfo });
}

async function handleGetDataSummary(supabase: any, userId: string) {
  // Get data counts from various tables
  const dataSummary = {
    profile: 0,
    tasks: 0,
    habits: 0,
    finance: 0,
    faith: 0,
    health: 0,
    total_records: 0,
    storage_used: '0 MB',
    account_age_days: 0
  };

  try {
    // Count records in each module
    const tables = [
      { name: 'tasks', key: 'tasks' },
      { name: 'habits', key: 'habits' },
      { name: 'transactions', key: 'finance' },
      { name: 'salat_logs', key: 'faith' },
      { name: 'health_metrics', key: 'health' },
      { name: 'user_profiles', key: 'profile' }
    ];

    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        dataSummary[table.key as keyof typeof dataSummary] = count || 0;
        dataSummary.total_records += count || 0;
      } catch (error) {
        console.error(`Error counting ${table.name}:`, error);
      }
    }

    // Calculate account age
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.created_at) {
      const createdAt = new Date(user.user.created_at);
      const now = new Date();
      dataSummary.account_age_days = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Estimate storage used (simplified calculation)
    dataSummary.storage_used = `${Math.round(dataSummary.total_records * 0.5)} KB`;

  } catch (error) {
    console.error('Error calculating data summary:', error);
  }

  return NextResponse.json({ data: dataSummary });
}

async function handleRequestDeletion(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = accountDeletionSchema.parse(body);

  // Check if there's already a pending deletion
  const { data: existingDeletion } = await supabase
    .from('account_deletions')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existingDeletion) {
    return NextResponse.json({ error: 'Account deletion already pending' }, { status: 409 });
  }

  // Create deletion request using database function
  const { data: result, error } = await supabase
    .rpc('request_account_deletion', {
      user_uuid: userId,
      deletion_reason: validatedData.reason,
      user_feedback: validatedData.feedback,
      delete_immediately: validatedData.delete_immediately,
      export_data: validatedData.export_data_before_deletion
    });

  if (error) {
    console.error('Error requesting account deletion:', error);
    return NextResponse.json({ error: 'Failed to request account deletion' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: result[0],
    message: 'Account deletion requested successfully' 
  });
}

async function handleCancelDeletion(supabase: any, userId: string) {
  const { data: result, error } = await supabase
    .rpc('cancel_account_deletion', {
      user_uuid: userId
    });

  if (error) {
    console.error('Error cancelling account deletion:', error);
    return NextResponse.json({ error: 'Failed to cancel account deletion' }, { status: 500 });
  }

  if (!result[0]?.success) {
    return NextResponse.json({ error: result[0]?.message || 'Failed to cancel deletion' }, { status: 400 });
  }

  return NextResponse.json({ 
    data: result[0],
    message: 'Account deletion cancelled successfully' 
  });
}

async function handleChangePassword(supabase: any, request: NextRequest, user: any) {
  const body = await request.json();
  const validatedData = passwordChangeSchema.parse(body);

  // Update password using Supabase Auth
  const { data, error } = await supabase.auth.updateUser({
    password: validatedData.new_password
  });

  if (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: { updated_at: data.user?.updated_at },
    message: 'Password changed successfully' 
  });
}

async function handleChangeEmail(supabase: any, request: NextRequest, user: any) {
  const body = await request.json();
  const validatedData = emailChangeSchema.parse(body);

  // Update email using Supabase Auth
  const { data, error } = await supabase.auth.updateUser({
    email: validatedData.new_email
  });

  if (error) {
    console.error('Error changing email:', error);
    return NextResponse.json({ error: 'Failed to change email' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: { 
      new_email: validatedData.new_email,
      confirmation_sent: true,
      updated_at: data.user?.updated_at 
    },
    message: 'Email change initiated. Please check your new email for confirmation.' 
  });
}

async function handleEnable2FA(supabase: any, userId: string) {
  // In a real implementation, you would:
  // 1. Generate TOTP secret
  // 2. Create QR code
  // 3. Store secret securely
  // 4. Return setup instructions

  const { data: updatedPrivacy, error } = await supabase
    .from('privacy_settings')
    .update({ two_factor_enabled: true })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: { 
      two_factor_enabled: true,
      setup_required: true,
      qr_code_url: 'data:image/png;base64,placeholder', // Would be real QR code
      backup_codes: ['123456', '789012'] // Would be real backup codes
    },
    message: '2FA enabled. Please complete setup with your authenticator app.' 
  });
}

async function handleDisable2FA(supabase: any, userId: string) {
  const { data: updatedPrivacy, error } = await supabase
    .from('privacy_settings')
    .update({ two_factor_enabled: false })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: { two_factor_enabled: false },
    message: '2FA disabled successfully' 
  });
}
