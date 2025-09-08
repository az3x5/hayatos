'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  summary?: string;
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Project Planning Notes',
    content: `# Project Planning Notes

## Overview
This project aims to create a comprehensive task management system with the following features:

### Key Features
- **Kanban Board**: Visual task organization
- **Calendar Integration**: Timeline management
- **Team Collaboration**: Shared workspaces
- **Reporting**: Analytics and insights

### Technical Stack
- Frontend: React with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL
- Authentication: JWT tokens

## Next Steps
1. Create wireframes for main dashboard
2. Set up development environment
3. Implement user authentication
4. Build core task management features

## Resources
- [Design System Documentation](https://example.com)
- [API Specification](https://api.example.com)
- [Project Timeline](https://timeline.example.com)`,
    tags: ['project', 'planning', 'development'],
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T15:30:00Z',
    summary: 'Comprehensive planning notes for a task management system project including features, tech stack, and next steps.'
  },
  {
    id: '2',
    title: 'Meeting Notes - Q1 Review',
    content: `# Q1 Review Meeting Notes

**Date**: January 15, 2024  
**Attendees**: John, Sarah, Mike, Lisa  
**Duration**: 2 hours

## Key Achievements
- Completed 85% of planned features
- User engagement increased by 40%
- Revenue grew by 25% compared to Q4

## Challenges Faced
- Performance issues with large datasets
- Mobile app crashes on older devices
- Customer support response time increased

## Action Items
- [ ] Optimize database queries (Mike - Jan 20)
- [ ] Fix mobile app compatibility (Sarah - Jan 25)
- [ ] Hire additional support staff (Lisa - Feb 1)
- [ ] Implement caching layer (John - Jan 30)

## Q2 Goals
1. Improve app performance by 50%
2. Launch new premium features
3. Expand to 2 new markets
4. Achieve 95% customer satisfaction`,
    tags: ['meeting', 'review', 'q1', 'goals'],
    created_at: '2024-01-15T14:00:00Z',
    updated_at: '2024-01-15T16:00:00Z',
    summary: 'Q1 review meeting covering achievements, challenges, action items, and Q2 goals.'
  }
];

export default function NotesEditor() {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (selectedNote) {
      setEditContent(selectedNote.content);
      setEditTitle(selectedNote.title);
    }
  }, [selectedNote]);

  const handleSave = () => {
    if (!selectedNote) return;

    const updatedNote = {
      ...selectedNote,
      title: editTitle,
      content: editContent,
      updated_at: new Date().toISOString()
    };

    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    setSelectedNote(updatedNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (selectedNote) {
      setEditContent(selectedNote.content);
      setEditTitle(selectedNote.title);
    }
    setIsEditing(false);
  };

  const handleAddTag = () => {
    if (!selectedNote || !newTag.trim()) return;

    const updatedNote = {
      ...selectedNote,
      tags: [...selectedNote.tags, newTag.trim()]
    };

    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    setSelectedNote(updatedNote);
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedNote) return;

    const updatedNote = {
      ...selectedNote,
      tags: selectedNote.tags.filter(tag => tag !== tagToRemove)
    };

    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    setSelectedNote(updatedNote);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '# New Note\n\nStart writing your note here...',
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setNotes(prev => [newNote, ...prev]);
    setSelectedNote(newNote);
    setIsEditing(true);
  };

  const handleAISummarize = () => {
    if (!selectedNote) return;
    
    // Mock AI summarization
    const summary = "AI-generated summary: " + selectedNote.content.slice(0, 100) + "...";
    
    const updatedNote = {
      ...selectedNote,
      summary
    };

    setNotes(prev => prev.map(note => 
      note.id === selectedNote.id ? updatedNote : note
    ));
    setSelectedNote(updatedNote);
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Notes List */}
      <div className="w-80 flex flex-col">
        <Card className="flex-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Notes</CardTitle>
              <Button size="sm" onClick={handleCreateNote}>
                <span className="mr-2">➕</span>
                New
              </Button>
            </div>
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="space-y-2 p-4">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-colors border",
                    selectedNote?.id === note.id
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted border-transparent"
                  )}
                >
                  <h4 className="font-medium text-sm mb-1 line-clamp-1">
                    {note.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {note.content.replace(/[#*`]/g, '').slice(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {note.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{note.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* Editor Header */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    {isEditing ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-lg font-semibold"
                      />
                    ) : (
                      <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <Button variant="outline" size="sm" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                          Save
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={handleAISummarize}>
                          🤖 Summarize
                        </Button>
                        <Button size="sm" onClick={() => setIsEditing(true)}>
                          ✏️ Edit
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-muted-foreground">Tags:</span>
                  {selectedNote.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-xs cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="w-24 h-6 text-xs"
                    />
                    <Button size="sm" variant="ghost" onClick={handleAddTag}>
                      +
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(selectedNote.created_at)} • 
                  Updated: {formatDate(selectedNote.updated_at)}
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            {selectedNote.summary && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2 flex items-center">
                    <span className="mr-2">🤖</span>
                    AI Summary
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedNote.summary}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Content Editor */}
            <Card className="flex-1">
              <CardContent className="p-0 h-full">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full p-4 border-0 resize-none focus:outline-none font-mono text-sm"
                    placeholder="Write your note in Markdown..."
                  />
                ) : (
                  <div className="p-4 h-full overflow-y-auto">
                    <div className="prose prose-sm max-w-none">
                      {selectedNote.content.split('\n').map((line, index) => {
                        if (line.startsWith('# ')) {
                          return <h1 key={index} className="text-xl font-bold mb-2">{line.slice(2)}</h1>;
                        } else if (line.startsWith('## ')) {
                          return <h2 key={index} className="text-lg font-semibold mb-2">{line.slice(3)}</h2>;
                        } else if (line.startsWith('### ')) {
                          return <h3 key={index} className="text-base font-medium mb-2">{line.slice(4)}</h3>;
                        } else if (line.startsWith('- ')) {
                          return <li key={index} className="ml-4">{line.slice(2)}</li>;
                        } else if (line.match(/^\d+\. /)) {
                          return <li key={index} className="ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return <p key={index} className="font-bold mb-2">{line.slice(2, -2)}</p>;
                        } else if (line.trim() === '') {
                          return <br key={index} />;
                        } else {
                          return <p key={index} className="mb-2">{line}</p>;
                        }
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No note selected</h3>
              <p className="text-gray-600 mb-4">Select a note from the list or create a new one</p>
              <Button onClick={handleCreateNote}>
                <span className="mr-2">➕</span>
                Create New Note
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
