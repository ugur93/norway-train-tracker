# Frontend Environment Setup

This guide explains how to configure environment variables for the frontend application.

## Local Development

1. **Copy the example file**:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Update `.env.local` with your Supabase credentials**:
   ```env
   VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your_actual_anon_key_here
   ```

3. **Get your Supabase credentials**:
   - Go to your [Supabase Dashboard](https://app.supabase.com)
   - Select your project
   - Go to **Settings** → **API**
   - Copy the **Project URL** → use as `VITE_SUPABASE_URL`
   - Copy the **anon/public key** → use as `VITE_SUPABASE_PUBLISHABLE_KEY`

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## GitHub Pages Deployment

The deployment workflow (`.github/workflows/deploy-frontend.yml`) is configured to use GitHub Secrets for environment variables.

### Setting up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

   **Secret 1:**
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase project URL (e.g., `https://xxxxxxxxxxxxx.supabase.co`)

   **Secret 2:**
   - Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
   - Value: Your Supabase anon/public key

5. Save both secrets

### Verifying the Setup

After setting up the secrets, the next deployment will automatically use them. You can:

1. **Manual deployment**: Go to **Actions** tab → **Deploy Frontend to GitHub Pages** → **Run workflow**
2. **Automatic deployment**: Push changes to the `main` branch in the `frontend/` directory

## Troubleshooting

### "Supabase URL not found" error

**Problem**: The frontend can't connect to Supabase.

**Solutions**:
- **Local development**: Ensure `.env.local` exists with correct values
- **Production**: Verify GitHub secrets are set correctly
- Check that variable names start with `VITE_` prefix (required by Vite)
- Restart the dev server after changing `.env.local`

### Environment variables are undefined

**Problem**: `import.meta.env.VITE_SUPABASE_URL` returns `undefined`.

**Solutions**:
- Ensure variables in `.env.local` start with `VITE_` prefix
- Restart the development server
- For production builds, ensure GitHub secrets are set

### Build fails in GitHub Actions

**Problem**: Deployment fails with environment variable errors.

**Solutions**:
- Verify both secrets are set in GitHub repository settings
- Check secret names match exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Re-run the workflow after fixing secrets

## Security Notes

- ⚠️ Never commit `.env.local` to version control (it's in `.gitignore`)
- ✅ The anon/public key is safe to expose in the frontend
- ✅ Use Row Level Security (RLS) policies in Supabase to protect your data
- ❌ Never use the `service_role` key in the frontend

## File Structure

```
frontend/
├── .env.example          # Template file (committed to git)
├── .env.local            # Your local config (ignored by git)
├── vite.config.ts        # Vite configuration
└── src/
    └── services/
        └── dataService.ts # Uses environment variables
```
