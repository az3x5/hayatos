# HayatOS Setup Guide

## 🚀 Quick Start

### 1. Dependencies Installed ✅
All required dependencies have been installed:
- Next.js 14 with TypeScript
- Supabase client libraries
- OpenAI integration
- Markdown editor components
- Vector search dependencies

### 2. Database Schema Ready ✅
The enhanced database schema includes:
- **Core tables**: users, projects, tasks, events, notes
- **AI features**: embeddings, entity extraction, knowledge graph
- **Faith content**: Quran, Hadith, Duas with semantic search
- **Row Level Security**: Complete RLS policies

### 3. API Endpoints Implemented ✅
Comprehensive API coverage:
- **Notes CRUD**: `/api/notes/*`
- **AI Processing**: `/api/notes/ai-summarize`
- **Semantic Search**: `/api/notes/search`
- **Knowledge Graph**: `/api/knowledge-graph`
- **Faith Content**: `/api/faith/*`

## 🛠️ Complete Setup Instructions

### Step 1: Environment Configuration
```bash
# Copy environment template
cp .env.local.example .env.local

# Edit .env.local with your values:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Step 2: Supabase Setup
```bash
# Start Supabase (requires Docker)
npx supabase start

# Apply migrations
npx supabase db reset

# Deploy Edge Functions
npx supabase functions deploy process-recurring-tasks
```

### Step 3: Start Development
```bash
# Start the development server
npm run dev

# Visit http://localhost:3000
```

## 🎯 Demo Mode Available

Since full Supabase setup requires Docker configuration, you can explore the Notes module in demo mode:

1. **Visit the homepage**: http://localhost:3000
2. **Try the Notes demo**: http://localhost:3000/notes
3. **Explore features**: Mock data demonstrates all functionality

## 📋 Features Demonstrated

### ✅ AI-Powered Notes
- Markdown editor with live preview
- AI-generated summaries and tags
- Word count and reading time
- Auto-save functionality

### 🔍 Advanced Search
- Keyword search
- Semantic search with embeddings
- Hybrid search combining both
- Faith content integration

### 🕸️ Knowledge Graph
- Entity extraction from notes
- Relationship mapping
- Related notes discovery
- Network visualization data

### 🕌 Faith Knowledge Base
- Quran verses with translations
- Hadith collections
- Duas for all occasions
- Bookmarking system

## 🔧 Production Setup

### Database Configuration
1. Create a Supabase project
2. Run the migration files in order:
   - `20240101000001_initial_schema.sql`
   - `20240101000002_rls_policies.sql`
   - `20240101000005_notes_enhancements.sql`
   - `20240101000006_notes_functions.sql`

### AI Integration
1. Get OpenAI API key from https://platform.openai.com/
2. Configure environment variables
3. Test AI features with sample content

### Vector Search Setup
1. Enable pgvector extension in Supabase
2. Create vector indexes for optimal performance
3. Generate embeddings for existing content

## 📊 File Structure

```
HayatOS/
├── app/
│   ├── api/
│   │   ├── notes/           # Notes CRUD & AI
│   │   ├── knowledge-graph/ # Entity relationships
│   │   └── faith/          # Faith content
│   ├── notes/              # Demo page
│   └── page.tsx            # Homepage
├── components/
│   ├── MarkdownEditor.tsx  # Rich editor
│   └── NotesDashboard.tsx  # Full dashboard
├── hooks/
│   └── useNotes.ts         # React hooks
├── supabase/
│   ├── migrations/         # Database schema
│   └── functions/          # Edge functions
└── types/
    └── database.ts         # TypeScript types
```

## 🚀 Next Steps

1. **Set up Supabase**: Follow the database setup instructions
2. **Configure OpenAI**: Add your API key for AI features
3. **Import Faith Data**: Load Quran, Hadith, and Duas datasets
4. **Test Features**: Create notes and explore AI capabilities
5. **Customize**: Extend with additional modules

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [pgvector Guide](https://github.com/pgvector/pgvector)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Troubleshooting

### Common Issues
1. **Docker permission errors**: Add user to docker group
2. **Supabase connection**: Check environment variables
3. **AI features not working**: Verify OpenAI API key
4. **Vector search slow**: Ensure proper indexes are created

### Getting Help
- Check the console for error messages
- Verify environment configuration
- Review migration logs
- Test API endpoints individually

---

The Notes module is now ready for use! Start with the demo mode to explore features, then set up the full environment for production use.
