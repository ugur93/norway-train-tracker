# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Norway Train Tracker is a dashboard application that displays train delay statistics for Norway, starting with the Oslo region. It fetches real-time data from the Entur API via a Supabase Edge Function and visualizes delay metrics, punctuality rates, and route statistics.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compile + Vite production build
npm run lint     # Run ESLint
npm run preview  # Preview production build locally
```

## Architecture

### Tech Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS 4 + Vite (rolldown-vite)
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Database**: PostgreSQL via Supabase
- **Data Source**: Entur GraphQL API

### Project Structure
```
norway-train-tracker/
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── App.tsx             # Main app with 4 views (overview, routes, stations, analytics)
│   │   ├── types.ts            # TypeScript interfaces and helpers
│   │   ├── services/dataService.ts  # Supabase client and data fetching
│   │   └── components/         # Reusable UI components
│   └── ...
├── supabase/
│   ├── functions/fetch-train-data/
│   │   ├── index.ts            # Edge Function: fetches from Entur, stores in DB
│   │   └── regions.ts          # Region configuration (stations, routes)
│   └── migrations/             # SQL migrations
└── ...
```

### Data Flow
1. Supabase Edge Function (`fetch-train-data`) queries Entur GraphQL API
2. Processes all departures (not just delayed) and calculates:
   - Total trips and on-time trips (punctuality)
   - Average delay minutes
   - Route and station pair statistics
3. Stores in database tables: `train_departures`, `daily_stats`, `route_stats`, `hourly_stats`
4. Frontend fetches aggregated data and displays in dashboard views

### Database Tables
- `train_departures` - Raw departure data with delay_minutes
- `daily_stats` - Daily aggregated station pair statistics with total_trips, on_time_trips
- `route_stats` - Daily aggregated route statistics
- `hourly_stats` - Hourly breakdown for peak hour analysis
- `routes` - Route configuration (code, name, type, stations)
- `stations` - Station reference data with coordinates

### Key Concepts
- **Punctuality**: On-time if delay <= 3 minutes (Norwegian standard)
- **Region**: Currently only 'oslo', but extensible to other regions
- **Route types**: local (L-series), regional (R-series), airport_express (FLY)

### Styling
- Custom Tailwind colors: `primary`, `success`, `warning`, `danger`
- Dark mode via `darkMode: "class"`
- Material Symbols Outlined for icons
- Mobile-first responsive design (max-w-md container)

### Environment Variables
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-anon-key>
```

### Running the Edge Function
```bash
# Deploy to Supabase
supabase functions deploy fetch-train-data

# Or invoke locally
supabase functions serve fetch-train-data
```
