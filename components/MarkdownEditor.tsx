'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/database';

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  note?: Note;
  onSave: (data: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onCancel?: () => void;
  projectId?: string;
  taskId?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface EditorState {
  title: string;
  content: string;
  tags: string[];
  excerpt: string;
  isPinned: boolean;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export default function MarkdownEditor({
  note,
  onSave,
  onCancel,
  projectId,
  taskId,
  autoSave = true,
  autoSaveDelay = 2000,
}: MarkdownEditorProps) {
  const [state, setState] = useState<EditorState>({
    title: note?.title || '',
    content: note?.content || '',
    tags: note?.tags || [],
    excerpt: note?.excerpt || '',
    isPinned: note?.is_pinned || false,
    isLoading: false,
    isSaving: false,
    hasUnsavedChanges: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{
    excerpt?: string;
    tags?: string[];
    isLoading: boolean;
  }>({ isLoading: false });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !state.hasUnsavedChanges || state.isSaving) return;

    const timeoutId = setTimeout(() => {
      handleSave(true); // Silent save
    }, autoSaveDelay);

    return () => clearTimeout(timeoutId);
  }, [state.title, state.content, state.hasUnsavedChanges, autoSave, autoSaveDelay]);

  // Update state when note prop changes
  useEffect(() => {
    if (note) {
      setState(prev => ({
        ...prev,
        title: note.title,
        content: note.content || '',
        tags: note.tags || [],
        excerpt: note.excerpt || '',
        isPinned: note.is_pinned,
        hasUnsavedChanges: false,
      }));
    }
  }, [note]);

  const updateState = useCallback((updates: Partial<EditorState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      hasUnsavedChanges: true,
    }));
  }, []);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateState({ title: e.target.value });
  }, [updateState]);

  const handleContentChange = useCallback((value?: string) => {
    updateState({ content: value || '' });
  }, [updateState]);

  const handleAddTag = useCallback((tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (trimmedTag && !state.tags.includes(trimmedTag)) {
      updateState({ tags: [...state.tags, trimmedTag] });
    }
  }, [state.tags, updateState]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    updateState({ tags: state.tags.filter(tag => tag !== tagToRemove) });
  }, [state.tags, updateState]);

  const handleTagInputKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (tagInput.trim()) {
        handleAddTag(tagInput);
        setTagInput('');
      }
    }
  }, [tagInput, handleAddTag]);

  const generateAISuggestions = useCallback(async () => {
    if (!state.content.trim() || state.content.length < 50) return;

    setAiSuggestions(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/notes/ai-summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: state.content,
          note_id: note?.id,
          generate_excerpt: true,
          generate_tags: true,
          max_excerpt_length: 200,
          max_tags: 8,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiSuggestions({
          excerpt: result.data.excerpt,
          tags: result.data.suggested_tags || [],
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setAiSuggestions(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.content, note?.id]);

  const applyAISuggestion = useCallback((type: 'excerpt' | 'tags') => {
    if (type === 'excerpt' && aiSuggestions.excerpt) {
      updateState({ excerpt: aiSuggestions.excerpt });
    } else if (type === 'tags' && aiSuggestions.tags) {
      const newTags = Array.from(new Set([...state.tags, ...aiSuggestions.tags]));
      updateState({ tags: newTags });
    }
  }, [aiSuggestions, state.tags, updateState]);

  const handleSave = useCallback(async (silent = false) => {
    if (!state.title.trim()) {
      if (!silent) alert('Please enter a title for the note');
      return;
    }

    setState(prev => ({ ...prev, isSaving: true }));

    try {
      const noteData = {
        title: state.title,
        content: state.content,
        excerpt: state.excerpt,
        tags: state.tags,
        is_pinned: state.isPinned,
        project_id: projectId || note?.project_id,
        task_id: taskId || note?.task_id,
      };

      await onSave(noteData);
      
      setState(prev => ({ 
        ...prev, 
        hasUnsavedChanges: false,
        isSaving: false 
      }));
    } catch (error) {
      console.error('Error saving note:', error);
      setState(prev => ({ ...prev, isSaving: false }));
      if (!silent) {
        alert('Failed to save note. Please try again.');
      }
    }
  }, [state, onSave, projectId, taskId, note]);

  const wordCount = state.content.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4 flex-1">
          <input
            type="text"
            value={state.title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="text-xl font-semibold bg-transparent border-none outline-none flex-1"
          />
          <button
            onClick={() => updateState({ isPinned: !state.isPinned })}
            className={`p-2 rounded ${state.isPinned ? 'text-yellow-500' : 'text-gray-400'}`}
            title={state.isPinned ? 'Unpin note' : 'Pin note'}
          >
            📌
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {state.hasUnsavedChanges && (
            <span className="text-sm text-orange-500">Unsaved changes</span>
          )}
          {state.isSaving && (
            <span className="text-sm text-blue-500">Saving...</span>
          )}
          <button
            onClick={generateAISuggestions}
            disabled={aiSuggestions.isLoading || state.content.length < 50}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
          >
            {aiSuggestions.isLoading ? '🤖 Analyzing...' : '🤖 AI Assist'}
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={state.isSaving || !state.title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Save
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      {(aiSuggestions.excerpt || aiSuggestions.tags) && (
        <div className="p-4 bg-purple-50 border-b">
          <h4 className="text-sm font-medium text-purple-800 mb-2">AI Suggestions</h4>
          
          {aiSuggestions.excerpt && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-purple-600">Suggested Excerpt:</span>
                <button
                  onClick={() => applyAISuggestion('excerpt')}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  Apply
                </button>
              </div>
              <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                {aiSuggestions.excerpt}
              </p>
            </div>
          )}
          
          {aiSuggestions.tags && aiSuggestions.tags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-purple-600">Suggested Tags:</span>
                <button
                  onClick={() => applyAISuggestion('tags')}
                  className="text-xs text-purple-600 hover:text-purple-800"
                >
                  Apply All
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {aiSuggestions.tags.map((tag, index) => (
                  <span
                    key={index}
                    onClick={() => handleAddTag(tag)}
                    className="px-2 py-1 text-xs bg-white text-purple-700 rounded border cursor-pointer hover:bg-purple-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags and Excerpt */}
      <div className="p-4 border-b space-y-3">
        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {state.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagInputKeyPress}
            placeholder="Add tags (press Enter or comma to add)"
            className="w-full px-3 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
          <textarea
            value={state.excerpt}
            onChange={(e) => updateState({ excerpt: e.target.value })}
            placeholder="Brief summary of the note..."
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <MDEditor
          value={state.content}
          onChange={handleContentChange}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          height="100%"
        />
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>{wordCount} words • {readingTime} min read</span>
        <span>
          {state.hasUnsavedChanges ? 'Modified' : 'Saved'} • 
          {autoSave ? ' Auto-save enabled' : ' Manual save'}
        </span>
      </div>
    </div>
  );
}
