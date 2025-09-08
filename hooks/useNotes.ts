import { useState, useEffect, useCallback } from 'react';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/database';

interface UseNotesOptions {
  search?: string;
  tags?: string[];
  project_id?: string;
  task_id?: string;
  is_pinned?: boolean;
  semantic_search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'word_count';
  sort_order?: 'asc' | 'desc';
  autoFetch?: boolean;
}

interface UseNotesReturn {
  notes: Note[];
  loading: boolean;
  error: string | null;
  pagination: any;
  searchType: 'regular' | 'semantic';
  refetch: () => Promise<void>;
  createNote: (note: CreateNoteRequest) => Promise<Note | null>;
  updateNote: (id: string, updates: Partial<UpdateNoteRequest>) => Promise<Note | null>;
  deleteNote: (id: string) => Promise<boolean>;
  searchNotes: (query: string, type?: 'keyword' | 'semantic' | 'hybrid') => Promise<void>;
}

export function useNotes(options: UseNotesOptions = {}): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);
  const [searchType, setSearchType] = useState<'regular' | 'semantic'>('regular');

  const { autoFetch = true, ...filterOptions } = options;

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      
      Object.entries(filterOptions).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/notes?${searchParams.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch notes');
      }

      setNotes(result.data || []);
      setPagination(result.pagination);
      setSearchType(result.search_type || 'regular');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filterOptions)]);

  const createNote = useCallback(async (noteData: CreateNoteRequest): Promise<Note | null> => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create note');
      }
      
      if (result.data) {
        setNotes(prev => [result.data, ...prev]);
        return result.data;
      }
      
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      console.error('Error creating note:', err);
      return null;
    }
  }, []);

  const updateNote = useCallback(async (id: string, updates: Partial<UpdateNoteRequest>): Promise<Note | null> => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update note');
      }
      
      if (result.data) {
        setNotes(prev => prev.map(note => note.id === id ? result.data : note));
        return result.data;
      }
      
      return null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      console.error('Error updating note:', err);
      return null;
    }
  }, []);

  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete note');
      }
      
      setNotes(prev => prev.filter(note => note.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
      console.error('Error deleting note:', err);
      return false;
    }
  }, []);

  const searchNotes = useCallback(async (query: string, type: 'keyword' | 'semantic' | 'hybrid' = 'hybrid') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notes/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          search_type: type,
          max_results: 20,
          include_faith_content: false,
          content_types: ['notes'],
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      setNotes(result.data.results || []);
      setSearchType(result.data.search_type || 'regular');
      setPagination({
        page: 1,
        limit: 20,
        total: result.data.total_results,
        total_pages: 1,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      console.error('Error searching notes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchNotes();
    }
  }, [fetchNotes, autoFetch]);

  return {
    notes,
    loading,
    error,
    pagination,
    searchType,
    refetch: fetchNotes,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
  };
}

// Hook for a single note
export function useNote(id: string | null) {
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch note');
      }

      setNote(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch note');
      console.error('Error fetching note:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  return {
    note,
    loading,
    error,
    refetch: fetchNote,
  };
}

// Hook for knowledge graph
export function useKnowledgeGraph() {
  const [graph, setGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async (options: {
    entity_types?: string[];
    min_connections?: number;
    max_entities?: number;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      
      if (options.entity_types) {
        searchParams.append('entity_types', options.entity_types.join(','));
      }
      if (options.min_connections) {
        searchParams.append('min_connections', options.min_connections.toString());
      }
      if (options.max_entities) {
        searchParams.append('max_entities', options.max_entities.toString());
      }

      const response = await fetch(`/api/knowledge-graph?${searchParams.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch knowledge graph');
      }

      setGraph(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch knowledge graph');
      console.error('Error fetching knowledge graph:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getRelatedNotes = useCallback(async (noteId: string) => {
    try {
      const response = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_id: noteId,
          action: 'get_related_notes',
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch related notes');
      }

      return result.data || [];
    } catch (err) {
      console.error('Error fetching related notes:', err);
      return [];
    }
  }, []);

  return {
    graph,
    loading,
    error,
    fetchGraph,
    getRelatedNotes,
  };
}

// Hook for faith content
export function useFaithContent() {
  const [content, setContent] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchFaithContent = useCallback(async (options: {
    content_type?: 'quran' | 'hadith' | 'duas' | 'all';
    search?: string;
    surah_number?: number;
    collection?: string;
    category?: string;
  } = {}) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams = new URLSearchParams();
      
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/faith?${searchParams.toString()}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to search faith content');
      }

      setContent(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search faith content');
      console.error('Error searching faith content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await fetch('/api/faith/bookmarks');
      const result = await response.json();
      
      if (response.ok) {
        setBookmarks(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  }, []);

  const createBookmark = useCallback(async (bookmark: {
    content_type: 'quran' | 'hadith' | 'dua';
    content_id: string;
    notes?: string;
    tags?: string[];
  }) => {
    try {
      const response = await fetch('/api/faith', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookmark),
      });

      const result = await response.json();
      
      if (response.ok) {
        setBookmarks(prev => [result.data, ...prev]);
        return result.data;
      }
    } catch (err) {
      console.error('Error creating bookmark:', err);
    }
    return null;
  }, []);

  return {
    content,
    bookmarks,
    loading,
    error,
    searchFaithContent,
    fetchBookmarks,
    createBookmark,
  };
}
