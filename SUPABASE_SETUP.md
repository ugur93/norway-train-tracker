# Supabase Setup Guide

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project called "norway-train-tracker"
3. Wait for the project to be fully initialized

## 2. Get API Keys
In your Supabase dashboard:
- Go to Settings → API
- Copy the following values:
  - Project URL
  - Anon public key
  - Service role key (for the Edge Function)

## 3. Create Database Tables
Run this SQL in the Supabase SQL Editor:

```sql
-- Create hourly_stats table
CREATE TABLE hourly_stats (
  id SERIAL PRIMARY KEY,
  hour INTEGER NOT NULL,
  from_stop TEXT NOT NULL,
  to_stop TEXT NOT NULL,
  avg_delay_minutes DECIMAL(5,2) NOT NULL,
  total_delay_minutes DECIMAL(8,2) NOT NULL,
  delay_count INTEGER NOT NULL,
  is_relevant BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create daily_stats table
CREATE TABLE daily_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  from_stop TEXT NOT NULL,
  to_stop TEXT NOT NULL,
  avg_delay_minutes DECIMAL(5,2) NOT NULL,
  total_delay_minutes DECIMAL(8,2) NOT NULL,
  delay_count INTEGER NOT NULL,
  is_relevant BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_stats table
CREATE TABLE route_stats (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  route_id TEXT NOT NULL,
  route_name TEXT NOT NULL,
  avg_delay_minutes DECIMAL(5,2) NOT NULL,
  total_delay_minutes DECIMAL(8,2) NOT NULL,
  delay_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hourly_stats_hour ON hourly_stats(hour);
CREATE INDEX idx_hourly_stats_route ON hourly_stats(from_stop, to_stop);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_route_stats_date ON route_stats(date);
```

## 4. Deploy Edge Function
```bash
# Install Supabase CLI (if not already installed)
npx supabase login

# Link to your project
npx supabase link --project-ref your-project-ref

# Deploy the function
npx supabase functions deploy fetch-train-data
```

## 5. Set Environment Variables for Edge Function
In Supabase Dashboard → Edge Functions → Environment Variables:
- `SUPABASE_URL`: Your project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## 6. Configure Frontend
Create a `.env.local` file in the `frontend/` directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 6.5. Create Test Environment File (Optional)
For testing the Edge Function locally, create a `.env` file in the project root:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

## 7. Set Up GitHub Actions Secrets
In your GitHub repo → Settings → Secrets and variables → Actions:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key

## 8. Test the Setup
1. **Test Edge Function locally:**
   ```bash
   npx supabase start
   npx supabase functions serve fetch-train-data
   ```

2. **Test GitHub Action:**
   - Go to Actions tab in GitHub
   - Run the "Fetch Train Data" workflow manually

3. **Test Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Troubleshooting

### Edge Function Issues
- Check the function logs in Supabase Dashboard → Edge Functions
- Ensure environment variables are set correctly
- Test the function URL directly with curl

### GitHub Actions Issues
- Check the Actions logs for errors
- Ensure secrets are set correctly
- Verify the function URL is accessible

### Frontend Issues
- Check browser console for errors
- Ensure environment variables are prefixed with `VITE_`
- Verify Supabase keys are correct

## Next Steps
Once everything is working:
1. The Edge Function will run every 10 minutes via GitHub Actions
2. Data will be stored in Supabase database
3. Frontend will fetch fresh data from Supabase
4. No more manual JSON file management!