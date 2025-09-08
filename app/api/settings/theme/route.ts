import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const themeUpdateSchema = z.object({
  theme_name: z.enum(['light', 'dark', 'islamic', 'auto']).optional(),
  custom_colors: z.record(z.string()).optional(),
  font_family: z.string().optional(),
  font_size: z.enum(['small', 'medium', 'large', 'extra_large']).optional(),
  arabic_font: z.string().optional(),
  compact_mode: z.boolean().optional(),
  animations_enabled: z.boolean().optional(),
  high_contrast: z.boolean().optional(),
});

const customThemeSchema = z.object({
  name: z.string().min(1).max(50),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i),
    background: z.string().regex(/^#[0-9A-F]{6}$/i),
    surface: z.string().regex(/^#[0-9A-F]{6}$/i),
    text: z.string().regex(/^#[0-9A-F]{6}$/i),
    textSecondary: z.string().regex(/^#[0-9A-F]{6}$/i),
  }),
  fonts: z.object({
    primary: z.string(),
    arabic: z.string(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user theme settings
    const { data: theme, error } = await supabase
      .from('user_themes')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching theme:', error);
      return NextResponse.json({ error: 'Failed to fetch theme settings' }, { status: 500 });
    }

    // If no theme exists, create default one
    if (!theme) {
      const { data: newTheme, error: createError } = await supabase
        .from('user_themes')
        .insert({
          user_id: session.user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating theme:', createError);
        return NextResponse.json({ error: 'Failed to create theme settings' }, { status: 500 });
      }

      return NextResponse.json({ data: newTheme });
    }

    return NextResponse.json({ data: theme });

  } catch (error) {
    console.error('Error in GET /api/settings/theme:', error);
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
    const validatedData = themeUpdateSchema.parse(body);

    // Update theme settings
    const { data: updatedTheme, error } = await supabase
      .from('user_themes')
      .update(validatedData)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating theme:', error);
      return NextResponse.json({ error: 'Failed to update theme settings' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedTheme,
      message: 'Theme settings updated successfully' 
    });

  } catch (error) {
    console.error('Error in PUT /api/settings/theme:', error);
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

    if (action === 'custom_theme') {
      return handleCustomTheme(supabase, request, session.user.id);
    }

    if (action === 'reset') {
      return handleResetTheme(supabase, session.user.id);
    }

    if (action === 'preview') {
      return handlePreviewTheme(request);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings/theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCustomTheme(supabase: any, request: NextRequest, userId: string) {
  try {
    const body = await request.json();
    const validatedData = customThemeSchema.parse(body);

    // Update theme with custom colors
    const { data: updatedTheme, error } = await supabase
      .from('user_themes')
      .update({
        theme_name: 'custom',
        custom_colors: {
          name: validatedData.name,
          colors: validatedData.colors,
          fonts: validatedData.fonts,
          created_at: new Date().toISOString(),
        }
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error saving custom theme:', error);
      return NextResponse.json({ error: 'Failed to save custom theme' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: updatedTheme,
      message: 'Custom theme saved successfully' 
    });

  } catch (error) {
    console.error('Error in custom theme:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid theme data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save custom theme' }, { status: 500 });
  }
}

async function handleResetTheme(supabase: any, userId: string) {
  try {
    // Reset to default theme
    const { data: resetTheme, error } = await supabase
      .from('user_themes')
      .update({
        theme_name: 'light',
        custom_colors: {},
        font_family: 'Inter',
        font_size: 'medium',
        arabic_font: 'Amiri',
        compact_mode: false,
        animations_enabled: true,
        high_contrast: false,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error resetting theme:', error);
      return NextResponse.json({ error: 'Failed to reset theme' }, { status: 500 });
    }

    return NextResponse.json({ 
      data: resetTheme,
      message: 'Theme reset to default successfully' 
    });

  } catch (error) {
    console.error('Error resetting theme:', error);
    return NextResponse.json({ error: 'Failed to reset theme' }, { status: 500 });
  }
}

async function handlePreviewTheme(request: NextRequest) {
  try {
    const body = await request.json();
    const { theme_name, custom_colors } = body;

    // Generate CSS variables for preview
    let cssVariables = '';

    if (theme_name === 'light') {
      cssVariables = `
        --color-primary: #10b981;
        --color-secondary: #6b7280;
        --color-accent: #3b82f6;
        --color-background: #ffffff;
        --color-surface: #f9fafb;
        --color-text: #111827;
        --color-text-secondary: #6b7280;
      `;
    } else if (theme_name === 'dark') {
      cssVariables = `
        --color-primary: #10b981;
        --color-secondary: #9ca3af;
        --color-accent: #60a5fa;
        --color-background: #111827;
        --color-surface: #1f2937;
        --color-text: #f9fafb;
        --color-text-secondary: #d1d5db;
      `;
    } else if (theme_name === 'islamic') {
      cssVariables = `
        --color-primary: #059669;
        --color-secondary: #6b7280;
        --color-accent: #d97706;
        --color-background: #f8fafc;
        --color-surface: #ffffff;
        --color-text: #1e293b;
        --color-text-secondary: #64748b;
      `;
    } else if (theme_name === 'custom' && custom_colors?.colors) {
      const colors = custom_colors.colors;
      cssVariables = `
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
        --color-background: ${colors.background};
        --color-surface: ${colors.surface};
        --color-text: ${colors.text};
        --color-text-secondary: ${colors.textSecondary};
      `;
    }

    return NextResponse.json({ 
      data: { 
        css_variables: cssVariables,
        theme_name,
        custom_colors 
      },
      message: 'Theme preview generated' 
    });

  } catch (error) {
    console.error('Error generating theme preview:', error);
    return NextResponse.json({ error: 'Failed to generate theme preview' }, { status: 500 });
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

    if (action === 'custom_theme') {
      // Remove custom theme and reset to light
      const { data: resetTheme, error } = await supabase
        .from('user_themes')
        .update({
          theme_name: 'light',
          custom_colors: {},
        })
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Error deleting custom theme:', error);
        return NextResponse.json({ error: 'Failed to delete custom theme' }, { status: 500 });
      }

      return NextResponse.json({ 
        data: resetTheme,
        message: 'Custom theme deleted successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in DELETE /api/settings/theme:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
