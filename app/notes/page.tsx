import NotesEditor from '@/components/notes/NotesEditor';

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notes</h1>
        <p className="text-muted-foreground">
          Create and manage your notes with AI-powered features
        </p>
      </div>
      
      <NotesEditor />
    </div>
  );
}
