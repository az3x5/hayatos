# 🚀 Vercel Deployment Guide for HayatOS

## 📋 Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Your code should be pushed to GitHub

## 🔧 Step 1: Set Up Supabase

1. **Create a new Supabase project**
2. **Get your project credentials**:
   - Go to Settings → API
   - Copy the `Project URL` and `anon public` key
3. **Run database migrations**:
   ```bash
   npx supabase db push
   ```

## 🌐 Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect GitHub**: Link your GitHub account to Vercel
2. **Import Project**: Select your HayatOS repository
3. **Configure Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Redeploy with environment variables
vercel --prod
```

## ⚙️ Step 3: Environment Variables

In your Vercel project settings, add these environment variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Your Supabase anon public key |

## 🔍 Step 4: Verify Deployment

1. **Check build logs** for any errors
2. **Test the deployed app** functionality
3. **Verify database connection** works

## 🐛 Common Issues & Solutions

### Build Errors

**Missing Environment Variables**:
```
"env.NEXT_PUBLIC_SUPABASE_URL" is missing
```
**Solution**: Add the environment variables in Vercel dashboard

**Module Not Found**:
```
Module not found: Can't resolve '@/lib/utils'
```
**Solution**: Ensure all required files are committed to Git

### Runtime Errors

**Database Connection Issues**:
- Verify Supabase URL and key are correct
- Check if database migrations are applied
- Ensure RLS policies allow public access where needed

## 📱 Step 5: Custom Domain (Optional)

1. **Add domain** in Vercel project settings
2. **Configure DNS** records as instructed
3. **Enable HTTPS** (automatic with Vercel)

## 🎉 Success!

Your HayatOS Personal Life Management System is now live! 

**Next Steps**:
- Set up user authentication
- Configure email notifications
- Add custom integrations
- Monitor performance and usage

---

**Need Help?** Check the [Vercel Documentation](https://vercel.com/docs) or [Supabase Documentation](https://supabase.com/docs)
