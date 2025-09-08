import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';

// Validation schema
const summarizeSchema = z.object({
  content: z.string().min(10, 'Content too short for summarization'),
  note_id: z.string().uuid().optional(),
  generate_excerpt: z.boolean().default(true),
  generate_tags: z.boolean().default(true),
  extract_entities: z.boolean().default(true),
  max_excerpt_length: z.number().min(50).max(500).default(200),
  max_tags: z.number().min(1).max(20).default(10),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const validatedData = summarizeSchema.parse(body);

    // Validate note ownership if note_id is provided
    if (validatedData.note_id) {
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('id')
        .eq('id', validatedData.note_id)
        .eq('user_id', session.user.id)
        .single();

      if (noteError || !note) {
        return NextResponse.json({ error: 'Note not found or access denied' }, { status: 404 });
      }
    }

    const results: any = {};

    // Generate excerpt
    if (validatedData.generate_excerpt) {
      try {
        const excerptPrompt = `
Please create a concise excerpt (${validatedData.max_excerpt_length} characters max) that captures the main idea of this text:

${validatedData.content}

Requirements:
- Maximum ${validatedData.max_excerpt_length} characters
- Capture the core message
- Use clear, engaging language
- End with proper punctuation
`;

        const excerptResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: excerptPrompt }],
          max_tokens: 100,
          temperature: 0.3,
        });

        results.excerpt = excerptResponse.choices[0]?.message?.content?.trim();
      } catch (error) {
        console.error('Error generating excerpt:', error);
        results.excerpt_error = 'Failed to generate excerpt';
      }
    }

    // Generate tags
    if (validatedData.generate_tags) {
      try {
        const tagsPrompt = `
Analyze this text and suggest ${validatedData.max_tags} relevant tags that would help categorize and find this content later:

${validatedData.content}

Requirements:
- Maximum ${validatedData.max_tags} tags
- Use lowercase, single words or short phrases
- Focus on topics, themes, and key concepts
- Avoid generic words like "note" or "text"
- Return as a JSON array of strings

Example: ["productivity", "time-management", "goals", "planning"]
`;

        const tagsResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: tagsPrompt }],
          max_tokens: 150,
          temperature: 0.2,
        });

        const tagsText = tagsResponse.choices[0]?.message?.content?.trim();
        try {
          results.suggested_tags = JSON.parse(tagsText || '[]');
        } catch {
          // Fallback: extract tags from text response
          results.suggested_tags = extractTagsFromText(tagsText || '');
        }
      } catch (error) {
        console.error('Error generating tags:', error);
        results.tags_error = 'Failed to generate tags';
      }
    }

    // Extract entities
    if (validatedData.extract_entities) {
      try {
        const entitiesPrompt = `
Extract important entities from this text and categorize them:

${validatedData.content}

Return a JSON object with entities categorized by type:
{
  "people": ["person names"],
  "places": ["locations, cities, countries"],
  "topics": ["main subjects, concepts"],
  "organizations": ["companies, institutions"],
  "events": ["meetings, conferences, dates"],
  "concepts": ["abstract ideas, methodologies"]
}

Only include entities that are clearly mentioned and relevant.
`;

        const entitiesResponse = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: entitiesPrompt }],
          max_tokens: 300,
          temperature: 0.1,
        });

        const entitiesText = entitiesResponse.choices[0]?.message?.content?.trim();
        try {
          results.entities = JSON.parse(entitiesText || '{}');
        } catch {
          results.entities = {};
        }
      } catch (error) {
        console.error('Error extracting entities:', error);
        results.entities_error = 'Failed to extract entities';
      }
    }

    // Generate embedding for semantic search
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: validatedData.content,
      });

      results.embedding = embeddingResponse.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      results.embedding_error = 'Failed to generate embedding';
    }

    // Update note with AI-generated data if note_id provided
    if (validatedData.note_id && !results.excerpt_error && !results.tags_error) {
      try {
        const updateData: any = {
          last_ai_processed_at: new Date().toISOString(),
        };

        if (results.excerpt) {
          updateData.excerpt = results.excerpt;
        }

        if (results.suggested_tags) {
          updateData.ai_generated_tags = results.suggested_tags;
        }

        if (results.embedding) {
          updateData.embedding = results.embedding;
        }

        // Calculate confidence score based on successful operations
        const totalOperations = 3; // excerpt, tags, embedding
        const successfulOperations = [
          !results.excerpt_error,
          !results.tags_error,
          !results.embedding_error,
        ].filter(Boolean).length;
        
        updateData.ai_confidence_score = successfulOperations / totalOperations;

        await supabase
          .from('notes')
          .update(updateData)
          .eq('id', validatedData.note_id)
          .eq('user_id', session.user.id);

        // Process entities and create knowledge graph connections
        if (results.entities && Object.keys(results.entities).length > 0) {
          await processEntitiesForNote(supabase, validatedData.note_id, results.entities);
        }

      } catch (error) {
        console.error('Error updating note with AI data:', error);
        results.update_error = 'Failed to update note with AI data';
      }
    }

    return NextResponse.json({
      data: results,
      message: 'AI processing completed',
    });

  } catch (error) {
    console.error('Error in POST /api/notes/ai-summarize:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to extract tags from text response
function extractTagsFromText(text: string): string[] {
  // Try to find tags in various formats
  const patterns = [
    /\[(.*?)\]/g, // [tag1, tag2, tag3]
    /"([^"]+)"/g, // "tag1", "tag2"
    /(\w+(?:-\w+)*)/g, // word or hyphenated-word
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return matches
        .map(match => match.replace(/[\[\]"]/g, '').trim().toLowerCase())
        .filter(tag => tag.length > 2 && tag.length < 30)
        .slice(0, 10);
    }
  }

  return [];
}

// Helper function to process entities and create knowledge graph
async function processEntitiesForNote(supabase: any, noteId: string, entities: any) {
  try {
    // First, delete existing note-entity relationships
    await supabase
      .from('note_entities')
      .delete()
      .eq('note_id', noteId);

    // Process each entity type
    for (const [entityType, entityNames] of Object.entries(entities)) {
      if (!Array.isArray(entityNames)) continue;

      for (const entityName of entityNames) {
        if (typeof entityName !== 'string' || entityName.trim().length === 0) continue;

        const cleanName = entityName.trim();

        // Insert or get entity
        const { data: existingEntity } = await supabase
          .from('entities')
          .select('id')
          .eq('name', cleanName)
          .eq('type', entityType)
          .single();

        let entityId;
        if (existingEntity) {
          entityId = existingEntity.id;
        } else {
          const { data: newEntity } = await supabase
            .from('entities')
            .insert({
              name: cleanName,
              type: entityType,
              description: `${entityType} extracted from notes`,
            })
            .select('id')
            .single();

          entityId = newEntity?.id;
        }

        if (entityId) {
          // Create note-entity relationship
          await supabase
            .from('note_entities')
            .insert({
              note_id: noteId,
              entity_id: entityId,
              relevance_score: 0.8, // Default relevance score
              context: `Mentioned as ${entityType}`,
            });
        }
      }
    }
  } catch (error) {
    console.error('Error processing entities:', error);
  }
}
