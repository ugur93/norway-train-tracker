# Train Delay Dashboard Architecture Plan

## Overview
This project aims to create a comprehensive dashboard visualizing train delay statistics for the Oslo region, focusing on routes radiating from Oslo Central Station (Oslo S). The dashboard provides two selectable views: individual station-pair delays and average route delays, using real-time data from the Entur API. Users can explore delay patterns by time period and gain insights into train reliability across major Norwegian transportation corridors including Drammen-Oslo, Oslo-Gardemoen, and connecting lines like Oslo-Sandvika and Oslo-Asker in both directions.

**Deployment Options:**
- **Supabase**: Cloud database with Edge Functions for serverless data processing and collection
- **GitHub Actions**: Scheduled automation for data collection every 10 minutes
- **Frontend**: Static hosting on Vercel/Netlify with Supabase integration

**Current Status:** Supabase Edge Function handles all data collection and processing. GitHub Actions scheduled to run every 10 minutes. Frontend fetches data directly from Supabase with proper station names displayed.

## Data Source
- **Entur GTFS-RT Trip Updates API**: Provides real-time trip updates with estimated arrival/departure times
- **API Endpoint**: https://api.entur.org/realtime/v1/gtfs-rt/trip-updates (open access, no API key required)
- **Format**: GTFS-RT protobuf (General Transit Feed Specification - Real Time)
- **Coverage**: Oslo region routes including Drammen-Oslo, Oslo-Gardemoen, Oslo-Sandvika, Oslo-Asker, and opposite directions

## Architecture Components

### 1. Data Collection (Supabase Edge Function)
- **Technology**: Deno/TypeScript with GTFS-RT protobuf parsing
- **Responsibilities**:
  - Fetch real-time data from Entur API every 10 minutes via GitHub Actions
  - Process and calculate delay statistics for Oslo region routes
  - Store aggregated data directly in Supabase database
  - Handle station name mapping for proper display
  - Automatic error handling and retry logic
- **Scheduling**: GitHub Actions workflow triggered every 10 minutes

### 2. Database
- **Technology**: Supabase (PostgreSQL) with Edge Functions
- **Tables**:
  - `daily_stats`: Aggregated daily delay statistics by station pair with station names
  - `hourly_stats`: Delay patterns by hour for each station pair
  - `route_stats`: Aggregated daily delay statistics for entire routes
  - `stations`: Station mapping table (ID to name translations)

### 3. Data Storage
- **Primary**: Supabase PostgreSQL database with real-time subscriptions
- **Station Names**: Proper station name mapping for user-friendly display
- **Update Frequency**: Every 10 minutes via GitHub Actions scheduled runs

### 4. Frontend Dashboard
- **Technology**: React 19 Single Page Application (SPA) with TypeScript
- **Libraries**:
  - Vite for build tooling
  - Tailwind CSS for styling
  - Supabase client for data fetching
  - Chart.js/D3.js for data visualization (planned)
- **Features**:
  - **View Selector**: Toggle between "Station Delays", "Route Average", and "Analytics" views
  - **Station View**: Interactive display of delay statistics between station pairs with proper station names
  - **Route View**: Charts showing average delays across entire routes with readable station names
  - **Analytics View**: Advanced statistics and trend analysis (framework ready)
  - Real-time data fetching from Supabase
  - Time period filtering (today, 7 days, 30 days)
  - Sorting options for delay data
  - **Station Names**: Human-readable station names displayed instead of technical IDs
- **Components Implemented**: ViewSelector, StationDelaysView, RouteAveragesView, AnalyticsView, TimeFilterSelector, SortSelector, StationCard, StationPairCard

### 5. Data Processing
- **Delay Calculation**: Compare estimated arrival/departure times with scheduled times for each station pair
- **Station-Pair Aggregation**:
  - Calculate delays between consecutive stations (Drammen→Asker, Asker→Sandvika, etc.)
  - Daily averages: Average delay per station pair per day
  - Hourly patterns: Average delay per station pair per hour
- **Route Aggregation**:
  - Combine station-pair delays to calculate route-wide averages
  - Weight by number of trips or distance between stations
- **Advanced Analytics Processing**:
  - Peak hour analysis: Compare delays during rush hours (7-9 AM, 4-6 PM) vs off-peak
  - Day-of-week patterns: Calculate average delays by weekday vs weekend
  - Reliability metrics: On-time rates, delay consistency (standard deviation), recovery rates
  - Trend analysis: Moving averages, seasonal patterns, month-over-month comparisons
  - Predictive modeling: Delay probability forecasting based on historical patterns
  - Impact calculations: Passenger impact estimates, economic cost analysis
  - Correlation analysis: Weather impact, delay propagation mapping
- **Data Cleaning**: Filter for relevant routes, handle missing data, exclude cancelled services

## Project Files

### Core Components
- `supabase/functions/fetch-train-data/`: Edge Function for data collection and processing
- `frontend/`: React 19 TypeScript application with station name display

### Automation
- `.github/workflows/`: GitHub Actions for scheduled data collection (every 10 minutes)
- `SUPABASE_SETUP.md`: Supabase configuration guide

### Frontend
- `frontend/src/components/`: Dashboard components with station name rendering
- `frontend/src/services/`: Data service layer with Supabase integration
- `frontend/src/types.ts`: TypeScript interfaces for station data with name fields

## Implementation Details

### Supabase Edge Function

#### Dependencies
- `gtfs-realtime-bindings`: For parsing GTFS-RT protobuf format
- `@supabase/supabase-js`: For database operations
- Deno runtime for serverless execution

#### Database Setup
- **Technology**: Supabase PostgreSQL
- **Tables**:
  - `daily_stats`: Aggregated daily delay statistics by station pair with station names
  - `hourly_stats`: Hourly delay patterns by station pair
  - `route_stats`: Daily delay statistics for entire routes
  - `stations`: Station ID to name mapping table

#### Function Structure
1. **Data Fetching**:
   - Make request to Entur GTFS-RT trip updates API
   - Parse protobuf response for trip updates and stop time updates
2. **Data Processing**:
   - Extract station-pair delays from trip updates
   - Filter for Oslo region routes (L1, L2, L12, L13, L21, R10, R20, FLY1, FLY2)
   - Map station IDs to human-readable names
   - Calculate daily and hourly aggregates for station pairs and routes
3. **Data Storage**:
   - Insert processed data directly into Supabase tables
4. **Scheduling**: Triggered by GitHub Actions every 10 minutes
   - Commit message with timestamp

#### Scheduling
- Use system cron to run the script periodically: `*/30 * * * * /usr/bin/python3 /path/to/script.py`
- Each cron execution fetches new data, updates the database, and regenerates JSON files

#### Error Handling
- Retry API calls on failure using requests retry mechanisms
- Log errors to file using Python logging
- Handle database connection issues with psycopg2 error handling
- Graceful failure without stopping the process

#### Security
- Store API keys and DB passwords in environment variables using python-dotenv
- Use HTTPS for API calls (requests handles this)
- Limit database permissions for the script user

#### Data Retention Strategy
- Keep all historical raw data in `realtime_data` for comprehensive analysis
- Maintain aggregated data indefinitely in `daily_stats`, `route_stats`, `hourly_stats`
- JSON files contain aggregated data for frontend consumption
- **Data Collection**: Supabase Edge Function executed every 10 minutes via GitHub Actions
- **Data Processing**: Serverless aggregation with station name mapping in Supabase
- **Frontend**: React SPA deployed on Vercel/Netlify, displaying station names from Supabase
- **CI/CD**: GitHub Actions for both data collection scheduling and frontend deployment

## Challenges
- **GTFS-RT Parsing in Deno**: Adapting GTFS-RT protobuf parsing to Deno runtime
- **Station Name Mapping**: Ensuring consistent station ID to name translations
- **GitHub Actions Scheduling**: Reliable 10-minute interval execution
- **Edge Function Performance**: Optimizing serverless function for data processing
- **Real-time Data Processing**: Handling live train data updates efficiently

## Detailed Implementation Plan

### Phase 1: Station/Route Discovery and Data Collection ✅ COMPLETED
1. **Research Oslo Region Routes**:
   - Identify all train routes serving the Oslo region from Oslo Central Station
   - Map all stations for routes: Drammen-Oslo, Oslo-Gardemoen, Oslo-Sandvika, Oslo-Asker
   - Include bidirectional coverage for all routes
   - Key station pairs: Drammen↔Sandvika↔Asker↔Oslo S, Oslo S↔Lillestrøm↔Oslo Lufthavn

2. **Update Data Fetcher**:
   - Modify `fetch_realtime_data()` to collect delays between all consecutive station pairs in Oslo region
   - Filter GTFS-RT data for relevant routes (L1, L2, Airport Express Train)
   - Store station-to-station delay data for all directions

3. **Database Schema Updates**:
   - Add `stations` table with station codes, names, and coordinates for Oslo region
   - Modify `realtime_data` to store station-pair delays for expanded coverage
   - Update aggregation tables to support station-pair statistics for multiple routes

### Phase 2: Data Processing and Aggregation
1. **Station-Level Statistics**:
   - Calculate average delays at each station (arrival/departure delays)
   - Generate `station_stats.json` with per-station delay metrics

2. **Route-Level Statistics**:
   - Calculate average delays for entire routes (Drammen→Gardemoen)
   - Generate `route_stats.json` with route-wide delay averages

3. **Time-Based Aggregation**:
   - Daily stats by station/route
   - Hourly patterns by station/route

### Phase 3: Frontend Development
1. **Component Architecture**:
   - Main Dashboard component with view selector (Station Delays, Route Averages, Analytics)
   - StationView component: Charts showing delays at individual stations
   - RouteView component: Charts showing average delays across the entire route
   - AnalyticsView component: Advanced statistics and trend analysis
   - Time selector (daily/hourly views)

2. **Data Visualization**:
   - Station view: Bar chart or map showing delay minutes at each station
   - Route view: Line chart showing cumulative delay from Drammen to Gardemoen
   - Analytics view: Multiple chart types (heatmaps, trend lines, radar charts, histograms)
   - Interactive elements: Hover for details, filter by time period

3. **Advanced Analytics Features**:
   - Peak hour performance comparison charts
   - Day-of-week trend analysis
   - Reliability metrics dashboard
   - Trend analysis with moving averages
   - Predictive delay probability charts
   - Impact analysis (passenger numbers, economic costs)

4. **Selectable Interface**:
   - Toggle switch or tabs: "Station Delays" vs "Route Average" vs "Analytics"
   - Time period selector: Last 24 hours, last week, last month
   - Route selector (if multiple routes are supported)

### Phase 4: Deployment and Testing
1. **Data Collection Setup**:
   - Deploy script on server with cron job every 30 minutes
   - Monitor data collection and JSON generation

2. **Frontend Deployment**:
   - Build React SPA with GitHub Pages deployment
   - Test JSON fetching from GitHub repository

3. **Integration Testing**:
   - Verify data flows from API → Database → JSON → Frontend
   - Test both station and route views
   - Performance testing with large datasets

### Technical Implementation Details

#### Station Pair Data Structure
```typescript
interface StationDelay {
  date: string;
  from_stop: string;        // Station ID (technical)
  from_stop_name: string;   // Human-readable station name
  to_stop: string;          // Station ID (technical)
  to_stop_name: string;     // Human-readable station name
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  is_relevant: boolean;
}
```

#### Route Data Structure
```typescript
interface RouteStats {
  date: string;
  route_id: string;
  route_name: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
}
```

#### Hourly Statistics Structure
```typescript
interface HourlyStats {
  hour: number;
  from_stop: string;        // Station ID (technical)
  from_stop_name: string;   // Human-readable station name
  to_stop: string;          // Station ID (technical)
  to_stop_name: string;     // Human-readable station name
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  is_relevant: boolean;
}
```

#### Frontend State Management
- React hooks for view selection and filtering
- Supabase real-time subscriptions for live data updates
- Station name mapping for user-friendly display (IDs stored internally, names shown to users)
- Local state management for UI interactions
- Error handling and loading states implemented

## Next Steps

### Phase 1: Supabase Edge Function Development ✅ COMPLETED
1. ✅ Implement Deno Edge Function with GTFS-RT protobuf parsing
2. ✅ Add Entur API integration for live data collection
3. ✅ Create station ID to name mapping functionality
4. ✅ Implement data aggregation logic for daily/hourly/route statistics
5. ✅ Set up Supabase database tables with proper schema

### Phase 2: GitHub Actions Automation 🔄 IN PROGRESS
1. ✅ Create GitHub Actions workflow for scheduled execution
2. ✅ Configure 10-minute interval scheduling
3. ✅ Set up proper authentication for Supabase Edge Function calls
4. 🔄 Test automated execution and error handling
5. 🔄 Monitor execution logs and performance

### Phase 3: Frontend Station Name Display ✅ COMPLETED
1. ✅ Update data fetching to include station names from Supabase
2. ✅ Modify components to display human-readable station names
3. ✅ Ensure proper sorting and filtering with station names
4. ✅ Test all views with station name display
5. ✅ Verify responsive design with longer station names

### Phase 4: Production Deployment and Monitoring 🔄 PENDING
1. 🔄 Deploy Supabase Edge Function to production
2. 🔄 Set up monitoring for GitHub Actions execution
3. 🔄 Configure error notifications and alerting
4. 🔄 Optimize Edge Function performance
5. 🔄 Set up frontend deployment with proper environment variables