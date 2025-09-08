'use client';

import React, { useState } from 'react';
import { useNotes, useKnowledgeGraph, useFaithContent } from '@/hooks/useNotes';
import MarkdownEditor from './MarkdownEditor';
import { Note, CreateNoteRequest, UpdateNoteRequest } from '@/types/database';

export default function NotesDashboard() {
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'graph' | 'faith'>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid');

  const {
    notes,
    loading: notesLoading,
    error: notesError,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
  } = useNotes();

  const {
    graph,
    loading: graphLoading,
    fetchGraph,
    getRelatedNotes,
  } = useKnowledgeGraph();

  const {
    content: faithContent,
    bookmarks,
    loading: faithLoading,
    searchFaithContent,
    fetchBookmarks,
    createBookmark,
  } = useFaithContent();

  const handleCreateNote = async (noteData: CreateNoteRequest) => {
    const newNote = await createNote(noteData);
    if (newNote) {
      setSelectedNote(newNote);
      setActiveView('list');
    }
  };

  const handleUpdateNote = async (noteData: UpdateNoteRequest) => {
    if (selectedNote) {
      const updatedNote = await updateNote(selectedNote.id, noteData);
      if (updatedNote) {
        setSelectedNote(updatedNote);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      const success = await deleteNote(noteId);
      if (success && selectedNote?.id === noteId) {
        setSelectedNote(null);
        setActiveView('list');
      }
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchNotes(searchQuery, searchType);
    }
  };

  const renderNotesList = () => (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="keyword">Keyword</option>
          <option value="semantic">Semantic</option>
          <option value="hybrid">Hybrid</option>
        </select>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {/* Notes Grid */}
      {notesLoading ? (
        <div className="text-center py-8">Loading notes...</div>
      ) : notesError ? (
        <div className="text-center py-8 text-red-600">Error: {notesError}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 border rounded-lg hover:shadow-md cursor-pointer transition-shadow"
              onClick={() => {
                setSelectedNote(note);
                setActiveView('editor');
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg truncate">{note.title}</h3>
                {note.is_pinned && <span className="text-yellow-500">📌</span>}
              </div>
              
              {note.excerpt && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-3">{note.excerpt}</p>
              )}
              
              <div className="flex flex-wrap gap-1 mb-3">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {tag}
                  </span>
                ))}
                {note.ai_generated_tags.slice(0, 2).map((tag, index) => (
                  <span
                    key={`ai-${index}`}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded"
                  >
                    🤖 {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{note.word_count} words • {note.reading_time} min</span>
                <span>{new Date(note.updated_at).toLocaleDateString()}</span>
              </div>
              
              <div className="mt-2 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderKnowledgeGraph = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Knowledge Graph</h2>
        <button
          onClick={() => fetchGraph()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Refresh Graph
        </button>
      </div>
      
      {graphLoading ? (
        <div className="text-center py-8">Loading knowledge graph...</div>
      ) : graph ? (
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{graph.stats.total_entities}</div>
              <div className="text-sm text-gray-600">Entities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{graph.stats.total_relationships}</div>
              <div className="text-sm text-gray-600">Relationships</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{graph.stats.entity_types.length}</div>
              <div className="text-sm text-gray-600">Entity Types</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{Math.round(graph.stats.avg_connections)}</div>
              <div className="text-sm text-gray-600">Avg Connections</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Top Entities:</h3>
            {graph.nodes.slice(0, 10).map((node: any) => (
              <div key={node.id} className="flex justify-between items-center p-2 bg-white rounded">
                <span className="font-medium">{node.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{node.type}</span>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {node.connections} connections
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          No knowledge graph data available. Create some notes to build your knowledge graph.
        </div>
      )}
    </div>
  );

  const renderFaithContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Faith Knowledge Base</h2>
        <button
          onClick={() => fetchBookmarks()}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Load Bookmarks
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => searchFaithContent({ content_type: 'quran' })}
          className="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="text-2xl mb-2">📖</div>
          <div className="font-medium">Quran</div>
          <div className="text-sm text-gray-600">Search verses</div>
        </button>
        
        <button
          onClick={() => searchFaithContent({ content_type: 'hadith' })}
          className="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="text-2xl mb-2">📜</div>
          <div className="font-medium">Hadith</div>
          <div className="text-sm text-gray-600">Prophetic traditions</div>
        </button>
        
        <button
          onClick={() => searchFaithContent({ content_type: 'duas' })}
          className="p-4 border rounded-lg hover:bg-gray-50 text-center"
        >
          <div className="text-2xl mb-2">🤲</div>
          <div className="font-medium">Duas</div>
          <div className="text-sm text-gray-600">Supplications</div>
        </button>
      </div>
      
      {faithContent.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Search Results:</h3>
          {faithContent.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">
                  {item.content_type === 'quran' && `${item.surah_name_english} ${item.surah_number}:${item.ayah_number}`}
                  {item.content_type === 'hadith' && `${item.collection} ${item.hadith_number}`}
                  {item.content_type === 'duas' && item.title}
                </h4>
                <button
                  onClick={() => createBookmark({
                    content_type: item.content_type === 'duas' ? 'dua' : item.content_type,
                    content_id: item.id,
                  })}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  🔖
                </button>
              </div>
              
              {item.ayah_text_english && (
                <p className="text-gray-700 mb-2">{item.ayah_text_english}</p>
              )}
              {item.hadith_text_english && (
                <p className="text-gray-700 mb-2">{item.hadith_text_english}</p>
              )}
              {item.dua_english && (
                <p className="text-gray-700 mb-2">{item.dua_english}</p>
              )}
              
              {item.reference && (
                <p className="text-sm text-gray-600">Reference: {item.reference}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Notes Dashboard</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('list')}
              className={`px-4 py-2 rounded-lg ${activeView === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveView('graph')}
              className={`px-4 py-2 rounded-lg ${activeView === 'graph' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Knowledge Graph
            </button>
            <button
              onClick={() => setActiveView('faith')}
              className={`px-4 py-2 rounded-lg ${activeView === 'faith' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
            >
              Faith
            </button>
            <button
              onClick={() => {
                setSelectedNote(null);
                setActiveView('editor');
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              New Note
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'list' && (
          <div className="h-full overflow-auto p-6">
            {renderNotesList()}
          </div>
        )}
        
        {activeView === 'editor' && (
          <div className="h-full p-6">
            <MarkdownEditor
              note={selectedNote || undefined}
              onSave={(data: any) => selectedNote ? handleUpdateNote(data) : handleCreateNote(data)}
              onCancel={() => setActiveView('list')}
              autoSave={true}
            />
          </div>
        )}
        
        {activeView === 'graph' && (
          <div className="h-full overflow-auto p-6">
            {renderKnowledgeGraph()}
          </div>
        )}
        
        {activeView === 'faith' && (
          <div className="h-full overflow-auto p-6">
            {renderFaithContent()}
          </div>
        )}
      </div>
    </div>
  );
}
