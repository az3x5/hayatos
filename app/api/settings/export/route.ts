import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const exportRequestSchema = z.object({
  export_format: z.enum(['json', 'csv', 'pdf']).default('json'),
  modules: z.array(z.string()).default(['all']),
  date_range_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_range_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  include_deleted: z.boolean().default(false),
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
    const exportId = url.searchParams.get('id');

    if (action === 'history') {
      return handleGetExportHistory(supabase, session.user.id);
    }

    if (action === 'download' && exportId) {
      return handleDownloadExport(supabase, exportId, session.user.id);
    }

    if (action === 'status' && exportId) {
      return handleGetExportStatus(supabase, exportId, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });

  } catch (error) {
    console.error('Error in GET /api/settings/export:', error);
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

    if (action === 'request') {
      return handleCreateExportRequest(supabase, request, session.user.id);
    }

    if (action === 'preview') {
      return handlePreviewExport(supabase, request, session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in POST /api/settings/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    const exportId = url.searchParams.get('id');

    if (!exportId) {
      return NextResponse.json({ error: 'Export ID required' }, { status: 400 });
    }

    // Delete export record and file
    const { data: exportRecord, error: fetchError } = await supabase
      .from('data_exports')
      .select('file_url')
      .eq('id', exportId)
      .eq('user_id', session.user.id)
      .single();

    if (fetchError || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    // Delete file from storage if exists
    if (exportRecord.file_url) {
      const fileName = exportRecord.file_url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('exports')
          .remove([`${session.user.id}/${fileName}`]);
      }
    }

    // Delete export record
    const { error: deleteError } = await supabase
      .from('data_exports')
      .delete()
      .eq('id', exportId)
      .eq('user_id', session.user.id);

    if (deleteError) {
      console.error('Error deleting export:', deleteError);
      return NextResponse.json({ error: 'Failed to delete export' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Export deleted successfully' });

  } catch (error) {
    console.error('Error in DELETE /api/settings/export:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleGetExportHistory(supabase: any, userId: string) {
  const { data: exports, error } = await supabase
    .rpc('get_user_exports', {
      user_uuid: userId
    });

  if (error) {
    console.error('Error fetching export history:', error);
    return NextResponse.json({ error: 'Failed to fetch export history' }, { status: 500 });
  }

  return NextResponse.json({ data: exports || [] });
}

async function handleDownloadExport(supabase: any, exportId: string, userId: string) {
  // Get export details
  const { data: exportRecord, error } = await supabase
    .from('data_exports')
    .select('*')
    .eq('id', exportId)
    .eq('user_id', userId)
    .single();

  if (error || !exportRecord) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  if (exportRecord.status !== 'completed') {
    return NextResponse.json({ error: 'Export not ready for download' }, { status: 400 });
  }

  if (exportRecord.expires_at && new Date(exportRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Export has expired' }, { status: 410 });
  }

  if (!exportRecord.file_url) {
    return NextResponse.json({ error: 'Export file not found' }, { status: 404 });
  }

  // Generate signed URL for download
  const fileName = exportRecord.file_url.split('/').pop();
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('exports')
    .createSignedUrl(`${userId}/${fileName}`, 3600); // 1 hour expiry

  if (urlError || !signedUrl) {
    console.error('Error creating signed URL:', urlError);
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }

  return NextResponse.json({ 
    data: { 
      download_url: signedUrl.signedUrl,
      expires_in: 3600,
      file_name: fileName,
      file_size: exportRecord.file_size
    } 
  });
}

async function handleGetExportStatus(supabase: any, exportId: string, userId: string) {
  const { data: exportRecord, error } = await supabase
    .from('data_exports')
    .select('id, status, export_format, modules, requested_at, completed_at, error_message, file_size')
    .eq('id', exportId)
    .eq('user_id', userId)
    .single();

  if (error || !exportRecord) {
    return NextResponse.json({ error: 'Export not found' }, { status: 404 });
  }

  return NextResponse.json({ data: exportRecord });
}

async function handleCreateExportRequest(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = exportRequestSchema.parse(body);

  // Create export request using database function
  const { data: result, error } = await supabase
    .rpc('export_user_data', {
      user_uuid: userId,
      export_format: validatedData.export_format,
      modules: validatedData.modules,
      include_deleted: validatedData.include_deleted
    });

  if (error) {
    console.error('Error creating export request:', error);
    return NextResponse.json({ error: 'Failed to create export request' }, { status: 500 });
  }

  // Start background processing (in a real implementation, you'd use a queue)
  processExportInBackground(supabase, result[0].export_id, userId, validatedData);

  return NextResponse.json({ 
    data: result[0],
    message: 'Export request created successfully. You will be notified when it\'s ready.' 
  }, { status: 201 });
}

async function handlePreviewExport(supabase: any, request: NextRequest, userId: string) {
  const body = await request.json();
  const validatedData = exportRequestSchema.parse(body);

  // Generate preview of what will be exported
  const preview = {
    estimated_size: '0 MB',
    estimated_records: 0,
    modules_included: [],
    date_range: null,
    format: validatedData.export_format,
  };

  // Calculate estimated data for each module
  const moduleQueries = {
    tasks: 'SELECT COUNT(*) FROM tasks WHERE user_id = $1',
    habits: 'SELECT COUNT(*) FROM habits WHERE user_id = $1',
    finance: 'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
    faith: 'SELECT COUNT(*) FROM salat_logs WHERE user_id = $1',
    health: 'SELECT COUNT(*) FROM health_metrics WHERE user_id = $1',
    profile: 'SELECT COUNT(*) FROM user_profiles WHERE user_id = $1',
  };

  let totalRecords = 0;
  const modulesIncluded = [];

  for (const module of validatedData.modules) {
    if (module === 'all') {
      // Include all modules
      for (const [moduleName, query] of Object.entries(moduleQueries)) {
        try {
          const { count } = await supabase
            .from(getTableName(moduleName))
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);
          
          if (count && count > 0) {
            modulesIncluded.push({
              name: moduleName,
              records: count,
              estimated_size: `${Math.round(count * 0.5)} KB`
            });
            totalRecords += count;
          }
        } catch (error) {
          console.error(`Error counting ${moduleName}:`, error);
        }
      }
      break;
    } else if (moduleQueries[module as keyof typeof moduleQueries]) {
      try {
        const { count } = await supabase
          .from(getTableName(module))
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        
        if (count && count > 0) {
          modulesIncluded.push({
            name: module,
            records: count,
            estimated_size: `${Math.round(count * 0.5)} KB`
          });
          totalRecords += count;
        }
      } catch (error) {
        console.error(`Error counting ${module}:`, error);
      }
    }
  }

  preview.estimated_records = totalRecords;
  preview.estimated_size = `${Math.round(totalRecords * 0.5)} KB`;
  preview.modules_included = modulesIncluded;

  if (validatedData.date_range_start && validatedData.date_range_end) {
    preview.date_range = {
      start: validatedData.date_range_start,
      end: validatedData.date_range_end
    };
  }

  return NextResponse.json({ data: preview });
}

function getTableName(module: string): string {
  const tableMap: { [key: string]: string } = {
    tasks: 'tasks',
    habits: 'habits',
    finance: 'transactions',
    faith: 'salat_logs',
    health: 'health_metrics',
    profile: 'user_profiles',
  };
  return tableMap[module] || module;
}

async function processExportInBackground(supabase: any, exportId: string, userId: string, exportData: any) {
  try {
    // Update status to processing
    await supabase
      .from('data_exports')
      .update({ status: 'processing' })
      .eq('id', exportId);

    // Simulate export processing (in production, this would be a proper background job)
    setTimeout(async () => {
      try {
        // Generate export data
        const exportContent = await generateExportContent(supabase, userId, exportData);
        
        // Upload to storage
        const fileName = `export_${exportId}_${Date.now()}.${exportData.export_format}`;
        const filePath = `${userId}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('exports')
          .upload(filePath, exportContent, {
            contentType: getContentType(exportData.export_format),
            cacheControl: '3600'
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('exports')
          .getPublicUrl(filePath);

        // Update export record
        await supabase
          .from('data_exports')
          .update({
            status: 'completed',
            file_url: publicUrl,
            file_size: exportContent.length,
            completed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
          })
          .eq('id', exportId);

      } catch (error) {
        console.error('Error processing export:', error);
        await supabase
          .from('data_exports')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', exportId);
      }
    }, 5000); // 5 second delay to simulate processing

  } catch (error) {
    console.error('Error starting export processing:', error);
  }
}

async function generateExportContent(supabase: any, userId: string, exportData: any): Promise<string> {
  // This is a simplified example - in production, you'd implement proper data export
  const userData = {
    export_info: {
      user_id: userId,
      export_date: new Date().toISOString(),
      format: exportData.export_format,
      modules: exportData.modules
    },
    data: {}
  };

  // Add placeholder data for each module
  if (exportData.modules.includes('all') || exportData.modules.includes('profile')) {
    userData.data = { ...userData.data, profile: { placeholder: 'User profile data' } };
  }

  if (exportData.format === 'json') {
    return JSON.stringify(userData, null, 2);
  } else if (exportData.format === 'csv') {
    return 'module,data\nprofile,"User profile data"';
  } else {
    return 'PDF export not implemented yet';
  }
}

function getContentType(format: string): string {
  const contentTypes = {
    json: 'application/json',
    csv: 'text/csv',
    pdf: 'application/pdf'
  };
  return contentTypes[format as keyof typeof contentTypes] || 'text/plain';
}
