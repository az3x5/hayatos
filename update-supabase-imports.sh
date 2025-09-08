#!/bin/bash

# Update all API route files to use the new Supabase SSR package

files=(
  "./app/api/events/route.ts"
  "./app/api/projects/route.ts"
  "./app/api/tasks/[id]/route.ts"
  "./app/api/tasks/route.ts"
  "./app/api/habits/[id]/route.ts"
  "./app/api/habits/[id]/checkin/route.ts"
  "./app/api/habits/route.ts"
  "./app/api/knowledge-graph/route.ts"
  "./app/api/finance/budgets/route.ts"
  "./app/api/finance/accounts/[id]/route.ts"
  "./app/api/finance/accounts/route.ts"
  "./app/api/finance/insights/route.ts"
  "./app/api/finance/banking/route.ts"
  "./app/api/finance/transactions/route.ts"
  "./app/api/notes/[id]/route.ts"
  "./app/api/notes/search/route.ts"
  "./app/api/notes/ai-summarize/route.ts"
  "./app/api/notes/route.ts"
  "./app/api/integrations/apple-health/route.ts"
  "./app/api/integrations/google-fit/route.ts"
  "./app/api/health/route.ts"
  "./app/api/health/goals/route.ts"
  "./app/api/notifications/push-tokens/route.ts"
  "./app/api/notifications/route.ts"
  "./app/api/faith/hadith/route.ts"
  "./app/api/faith/salat/route.ts"
  "./app/api/faith/azkar/route.ts"
  "./app/api/faith/route.ts"
  "./app/api/faith/bookmarks/route.ts"
  "./app/api/faith/quran/route.ts"
  "./app/api/settings/profile/route.ts"
  "./app/api/settings/integrations/route.ts"
  "./app/api/settings/notifications/route.ts"
  "./app/api/settings/route.ts"
  "./app/api/settings/export/route.ts"
  "./app/api/settings/theme/route.ts"
  "./app/api/settings/account/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Replace the import statement
    sed -i 's/import { createRouteHandlerClient } from '\''@supabase\/auth-helpers-nextjs'\'';/import { createSupabaseRouteHandlerClient } from '\''@\/lib\/supabase-server'\'';/g' "$file"
    
    # Remove the cookies import if it's only used for Supabase
    sed -i '/^import { cookies } from '\''next\/headers'\'';$/d' "$file"
    
    # Replace the client creation
    sed -i 's/const supabase = createRouteHandlerClient({ cookies });/const supabase = await createSupabaseRouteHandlerClient();/g' "$file"
    
    echo "Updated $file"
  else
    echo "File not found: $file"
  fi
done

echo "All files updated!"
