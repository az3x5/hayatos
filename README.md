# HayatOS - Personal Life Management System

![HayatOS Logo](https://via.placeholder.com/800x200/4F46E5/FFFFFF?text=HayatOS+-+Personal+Life+Management+System)

## 🌟 Overview

HayatOS is a comprehensive personal life management system designed to help you organize, track, and optimize every aspect of your daily life. Built with modern web technologies and Islamic principles in mind, it provides a unified platform for managing tasks, habits, health, finances, and spiritual practices.

## ✨ Features

### 📋 **Task Management**
- **Smart Task Organization**: Projects, categories, and priority levels
- **Kanban Board**: Visual task management with drag-and-drop
- **Recurring Tasks**: Flexible scheduling with advanced recurrence patterns
- **Calendar Integration**: Seamless calendar view and event management
- **Collaboration**: Team projects and task sharing
- **Time Tracking**: Built-in time tracking and productivity analytics

### 🎯 **Habit Tracking**
- **Flexible Habits**: Daily, weekly, monthly, and custom patterns
- **Streak Visualization**: GitHub-style heatmap for habit tracking
- **Mood Integration**: Track mood with each habit check-in
- **Smart Reminders**: Configurable notifications and email reminders
- **Progress Analytics**: Completion rates, trends, and insights
- **Habit Stacking**: Link related habits for better consistency

### 📝 **Knowledge Management**
- **Markdown Editor**: Rich text editing with live preview
- **AI-Powered Features**: Automatic summarization and tag suggestions
- **Semantic Search**: Vector-based search across all notes
- **Knowledge Graph**: Automatic entity extraction and relationship mapping
- **Version History**: Track changes and restore previous versions
- **Export/Import**: Multiple formats including PDF, HTML, and Markdown

### 💰 **Financial Management**
- **Account Management**: Multiple accounts with real-time balances
- **Transaction Tracking**: Categorized expense and income tracking
- **Budget Planning**: Monthly budgets with progress tracking
- **Financial Insights**: Spending analysis and savings recommendations
- **Recurring Transactions**: Automatic handling of regular payments
- **Banking Integration**: Connect with banks for automatic transaction import

### 🕌 **Faith & Spirituality**
- **Salat Tracker**: Five daily prayers with streak tracking
- **Quran Reader**: Complete Quran with translations and audio
- **Hadith Library**: Searchable collection of authentic hadith
- **Duas Collection**: Categorized supplications for various occasions
- **Azkar Reminders**: Morning, evening, and post-prayer remembrance
- **Islamic Calendar**: Hijri dates and Islamic occasions

### ❤️ **Health & Wellness**
- **Health Metrics**: Sleep, water, exercise, diet, mood, and vitals
- **Goal Setting**: Personalized health targets with progress tracking
- **Trend Analysis**: Statistical analysis with moving averages
- **Integration Support**: Google Fit and Apple Health connectivity
- **Medication Tracking**: Reminders and adherence monitoring
- **Wellness Reports**: Comprehensive health summaries

### ⚙️ **Settings & Customization**
- **Profile Management**: Personal information and preferences
- **Theme System**: Light, dark, and Islamic themes with customization
- **Notification Control**: Granular notification preferences
- **Data Export**: Complete data export in multiple formats
- **Privacy Settings**: Comprehensive privacy and security controls
- **Integration Management**: Third-party service connections

## 🚀 Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern UI component library
- **React Hook Form**: Form management with validation
- **Zustand**: Lightweight state management

### **Backend**
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Row Level Security**: Database-level security policies
- **Edge Functions**: Serverless functions for complex operations
- **Real-time Subscriptions**: Live data updates
- **Authentication**: Multi-provider auth with JWT

### **Database**
- **PostgreSQL**: Robust relational database
- **pgvector**: Vector embeddings for semantic search
- **JSONB**: Flexible data storage for health metrics
- **Advanced Functions**: Custom SQL functions for analytics
- **Migrations**: Version-controlled database schema

### **Integrations**
- **Google Fit**: Health data synchronization
- **Apple Health**: iOS health data integration
- **Banking APIs**: Transaction import (Plaid-compatible)
- **Email Services**: Notification and reminder emails
- **Push Notifications**: Cross-platform notifications

## 📱 Mobile Experience

- **Responsive Design**: Works perfectly on all screen sizes
- **Bottom Navigation**: 5-tab mobile navigation for easy access
- **Touch-Friendly**: Optimized for mobile interactions
- **Offline Support**: Core features work without internet
- **PWA Ready**: Installable as a Progressive Web App

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- Supabase account
- Git

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hayatos.git
   cd hayatos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

4. **Run database migrations**
   ```bash
   npx supabase db reset
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📊 Key Features Implemented

✅ **Complete Task Management System**
✅ **Comprehensive Habit Tracking**
✅ **Advanced Notes with AI Features**
✅ **Full Financial Management**
✅ **Islamic Faith Module**
✅ **Health & Wellness Tracking**
✅ **Settings & Customization**
✅ **Mobile-Optimized Layout**
✅ **Supabase Backend Integration**
✅ **TypeScript & Modern Stack**

## 🔧 API Documentation

### Authentication
All API endpoints require authentication via Supabase JWT tokens.

### Core Endpoints

#### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

#### Habits
- `GET /api/habits` - List habits with stats
- `POST /api/habits` - Create new habit
- `POST /api/habits/[id]/checkin` - Log habit completion

#### Health
- `GET /api/health` - Fetch health logs
- `POST /api/health` - Create health log
- `GET /api/health/goals` - Get health goals

#### Finance
- `GET /api/finance/accounts` - List accounts
- `POST /api/finance/transactions` - Create transaction
- `GET /api/finance/budgets` - Get budgets

#### Faith
- `GET /api/faith/quran` - Quran verses and surahs
- `POST /api/faith/salat` - Log prayer
- `GET /api/faith/hadith` - Search hadith

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Islamic Content**: Authentic sources for Quran, Hadith, and Duas
- **UI Components**: Shadcn/ui for beautiful, accessible components
- **Icons**: Lucide React for consistent iconography
- **Inspiration**: Islamic principles of organization and mindfulness

---

**Built with ❤️ for personal productivity and spiritual growth**
