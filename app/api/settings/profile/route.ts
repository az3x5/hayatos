import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const profileUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  phone_number: z.string().optional(),
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  timezone: z.string().optional(),
  language: z.string().min(2).max(5).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    // If no profile exists, create default one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: session.user.id,
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating profile:', createError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json({ data: newProfile });
    }

    return NextResponse.json({ data: profile });

  } catch (error) {
    console.error('Error in GET /api/settings/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = profileUpdateSchema.parse(body);

    // Update profile
    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(validatedData)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedProfile,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/settings/profile:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
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

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'upload_avatar') {
      return handleAvatarUpload(supabase, request, session.user.id);
    }

    if (action === 'initialize') {
      return handleInitializeProfile(supabase, session.user);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleAvatarUpload(supabase: any, request: NextRequest, userId: string) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File size too large. Maximum 5MB allowed.' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError);
      return NextResponse.json({ error: 'Failed to update profile with avatar' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: { avatar_url: publicUrl },
      message: 'Avatar uploaded successfully' 
    });

  } catch (error) {
    console.error('Error in avatar upload:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}

async function handleInitializeProfile(supabase: any, user: any) {
  try {
    // Initialize user settings using the database function
    const { error: initError } = await supabase
      .rpc('initialize_user_settings', {
        user_uuid: user.id
      });

    if (initError) {
      console.error('Error initializing user settings:', initError);
      return NextResponse.json({ error: 'Failed to initialize user settings' }, { status: 500 });
    }

    // Get the initialized profile
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching initialized profile:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch initialized profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: profile,
      message: 'User settings initialized successfully' 
    });

  } catch (error) {
    console.error('Error initializing profile:', error);
    return NextResponse.json({ error: 'Failed to initialize profile' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'avatar') {
      // Get current avatar URL
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('user_id', session.user.id)
        .single();

      if (profile?.avatar_url) {
        // Extract file path from URL
        const urlParts = profile.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `avatars/${fileName}`;

        // Delete from storage
        await supabase.storage
          .from('user-uploads')
          .remove([filePath]);
      }

      // Update profile to remove avatar URL
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error removing avatar:', error);
        return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 });
      }

      return NextResponse.json({ 
        data: updatedProfile,
        message: 'Avatar removed successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in DELETE /api/settings/profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
