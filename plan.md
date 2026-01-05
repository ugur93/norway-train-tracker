# Train Delay Dashboard Architecture Plan

## Overview
This project aims to create a comprehensive dashboard visualizing train delay statistics for the Oslo region, focusing on routes radiating from Oslo Central Station (Oslo S). The dashboard provides two selectable views: individual station-pair delays and average route delays, using real-time data from the Entur API. Users can explore delay patterns by time period and gain insights into train reliability across major Norwegian transportation corridors including Drammen-Oslo, Oslo-Gardemoen, and connecting lines like Oslo-Sandvika and Oslo-Asker in both directions.

**Deployment Options:**
- **Docker**: Full containerized deployment with `docker-compose.yml` (PostgreSQL + pgAdmin)
- **Native**: Traditional server deployment with cron automation
- **Hybrid**: JSON-only static hosting without database backend

**Current Status:** Backend infrastructure complete with automated data collection, database integration, and deployment tooling ready for production.

## Data Source
- **Entur GTFS-RT Trip Updates API**: Provides real-time trip updates with estimated arrival/departure times
- **API Endpoint**: https://api.entur.org/realtime/v1/gtfs-rt/trip-updates (open access, no API key required)
- **Format**: GTFS-RT protobuf (General Transit Feed Specification - Real Time)
- **Coverage**: Oslo region routes including Drammen-Oslo, Oslo-Gardemoen, Oslo-Sandvika, Oslo-Asker, and opposite directions

## Architecture Components

### 1. Data Collection Script
- **Technology**: Python
- **Responsibilities**:
  - Run on personal server (e.g., Raspberry Pi or VPS)
  - Fetch real-time data from Entur API every 30-60 seconds
  - Process and calculate delay statistics
  - Store aggregated data in PostgreSQL database
  - Generate truncated JSON files with statistics
  - Commit updated JSON files to GitHub repository
- **Scheduling**: Automated execution via cron jobs using `run_data_fetcher.sh` and `setup_cron.sh` for 30-minute, hourly, or daily intervals

### 2. Database
- **Technology**: PostgreSQL (native or Docker)
- **Deployment Options**:
  - Docker Compose: `docker-compose.yml` with pgAdmin web interface
  - Native installation: Manual setup with `setup_database.py`
- **Tables**:
  - `stations`: Station codes, names, and coordinates for Oslo region routes
  - `station_pair_delays`: Raw delay data between consecutive station pairs in Oslo region
  - `daily_station_stats`: Aggregated daily delay statistics by station pair for Oslo region routes
  - `daily_route_stats`: Aggregated daily delay statistics for entire routes (Drammen-Oslo, Oslo-Gardemoen)
  - `hourly_station_stats`: Delay patterns by hour for each station pair in Oslo region
  - `hourly_route_stats`: Delay patterns by hour for entire routes
  - `peak_hour_stats`: Rush hour vs off-peak delay comparisons
  - `reliability_stats`: On-time rates, consistency metrics, and recovery analysis
  - `trend_stats`: Moving averages and seasonal pattern analysis
  - `predictive_stats`: Delay probability forecasting and predictive insights
  - `impact_stats`: Passenger impact estimates and economic cost calculations
- `daily_route_stats`: Aggregated daily delay statistics for entire routes (Drammen-Oslo, Oslo-Gardemoen)
- `hourly_station_stats`: Delay patterns by hour for each station pair in Oslo region
- `hourly_route_stats`: Delay patterns by hour for entire routes

### 3. Data Storage (JSON)
- **Format**: JSON files committed to GitHub repository
- **Files**:
  - `station_delays.json`: Station-pair specific delay statistics for Oslo region routes
  - `route_delays.json`: Route-level aggregated delay statistics (Drammen-Oslo, Oslo-Gardemoen)
  - `daily_stats.json`: Daily summaries for all station pairs and routes in Oslo region
  - `hourly_stats.json`: Hourly patterns for all station pairs and routes in Oslo region
  - `analytics_stats.json`: Advanced analytics including peak hour performance, reliability metrics, and trend analysis
  - `predictive_stats.json`: Predictive insights and delay probability forecasting
- **Update Frequency**: Daily commits with latest aggregated data

### 4. Frontend Dashboard
- **Technology**: React 19 Single Page Application (SPA) with TypeScript
- **Libraries**:
  - Chart.js or D3.js for data visualization
  - Axios or fetch for loading JSON files from GitHub repository
  - Material-UI or Bootstrap for UI components
- **Features**:
  - **View Selector**: Toggle between "Station Delays", "Route Average", and "Analytics" views
  - **Station View**: Interactive charts showing delay minutes at each station along Oslo region routes
  - **Route View**: Charts showing average delays across entire routes (Drammen-Oslo, Oslo-Gardemoen)
  - **Analytics View**: Advanced statistics including delay patterns, reliability metrics, and trend analysis
  - Fetch statistics directly from JSON files in the GitHub repository
  - Time period selector (daily/hourly views)
  - Historical trend analysis
  - **Advanced Statistics**:
    - Peak hour performance analysis (rush hour vs off-peak delays)
    - Day-of-week trends (weekday vs weekend patterns)
    - On-time rate calculations by route and station
    - Delay consistency metrics (standard deviation analysis)
    - Recovery rate analysis (time to return to normal service)
    - Delay propagation mapping (upstream delay impacts)
    - Passenger impact estimates (number affected by delays)
    - Economic cost calculations (productivity loss from delays)
    - Trend analysis (30-day moving averages, seasonal patterns)
    - Weather correlation analysis (temperature/precipitation impact)
    - Journey time variability metrics
    - Performance rankings (most reliable stations/routes)
    - Predictive insights (delay probability forecasting)

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

### Core Scripts
- `data_fetcher.py`: Main data collection and processing script
- `setup_database.py`: Database setup and table creation
- `test_api_integration.py`: API integration testing suite

### Deployment & Automation
- `docker-compose.yml`: Docker Compose configuration for PostgreSQL + pgAdmin
- `init-db.sql`: Database initialization script (runs automatically in Docker)
- `run_data_fetcher.sh`: Cron job script for automated data collection
- `setup_cron.sh`: Interactive cron job setup and management tool

### Configuration
- `requirements.txt`: Python dependencies
- `docker-env`: Environment variables for Docker deployment
- `README.md`: Project documentation and setup instructions

### Data Output
- `tmp/`: Directory for generated JSON files
  - `station_delays.json`: Raw station-pair delay data
  - `daily_stats.json`: Daily aggregated statistics
  - `hourly_stats.json`: Hourly delay patterns
  - `route_stats.json`: Route-level aggregations
- `logs/`: Application logs
  - `cron.log`: Cron job execution logs

## Implementation Details

### Python Data Collection Script

#### Dependencies
- `psycopg2`: PostgreSQL adapter for Python
- `requests`: For HTTP requests to Entur API
- `gtfs-realtime-bindings`: For parsing GTFS-RT protobuf format
- `gitpython`: For Git operations to commit JSON files
- `python-crontab` or `schedule`: For scheduling (alternative to system cron)
- `python-dotenv`: For environment variables (DB credentials)
- `pandas`: For data processing and aggregation

#### Database Setup
- **Technology**: PostgreSQL
- **Setup Script**: `setup_database.py` - Manual PostgreSQL setup
- **Docker Setup**: `docker-compose.yml` - Automated containerized database with pgAdmin
- **Database Initialization**: `init-db.sql` - Automatic schema creation and data seeding
- **Tables**:
  - `stations`: Station codes, names, and coordinates for Oslo region routes
  - `station_pair_delays`: Raw delay data between consecutive station pairs in Oslo region
  - `daily_station_stats`: Aggregated daily delay statistics by station pair for Oslo region routes
  - `daily_route_stats`: Aggregated daily delay statistics for entire routes (Drammen-Oslo, Oslo-Gardemoen)
  - `hourly_station_stats`: Delay patterns by hour for each station pair in Oslo region
  - `hourly_route_stats`: Delay patterns by hour for entire routes
- **Environment**: PostgreSQL server (native or Docker), credentials configured in environment variables

#### API Integration Testing
- **Test Script**: `test_api_integration.py` - Comprehensive testing of Entur API connectivity and data processing
- **Tests Include**:
  - API endpoint accessibility and GTFS-RT parsing
  - Station pair delay extraction from real-time data
  - Complete data processing pipeline validation
- **Usage**: Run `python3 test_api_integration.py` to validate API integration before deployment

#### Deployment and Automation
- **Docker Setup**: `docker-compose.yml` - Containerized PostgreSQL database with pgAdmin web interface
  - Database: `train_delays` with user `train_delays_user`
  - pgAdmin: Accessible at http://localhost:8080 (admin@traindelays.local / admin123)
  - Automatic schema initialization via `init-db.sql`
- **Cron Job Automation**: `run_data_fetcher.sh` and `setup_cron.sh`
  - `run_data_fetcher.sh`: Executable script for periodic data collection
  - `setup_cron.sh`: Interactive setup tool for configuring automated execution
  - Supports 30-minute, hourly, and daily schedules
  - Comprehensive logging to `logs/cron.log`

#### Script Structure
1. **Configuration**: Load environment variables for API endpoints, DB connection, Git repo path
2. **Data Fetching**:
   - Make request to Entur GTFS-RT trip updates API
   - Parse protobuf response for trip updates and stop time updates
3. **Data Processing**:
   - Extract station-pair delays from trip updates
   - Filter for Drammen-Gardemoen corridor routes
   - Insert raw station-pair delay data into database
   - Calculate daily and hourly aggregates for station pairs and routes
4. **JSON Generation**:
   - Query aggregated data from database
   - Generate `station_delays.json`, `route_delays.json`, `daily_stats.json`, `hourly_stats.json`
   - Include station-pair data and route aggregates
5. **Git Commit**:
   - Use GitPython to add, commit, and push JSON files to GitHub
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
- **Data Collection**: Python script executed periodically by cron jobs on personal server
- **Data Storage**: JSON files automatically committed to GitHub repository
- **Frontend**: React SPA deployed on GitHub Pages or Netlify, fetching JSON data directly from the repository
- **CI/CD**: GitHub Actions for frontend deployment; script handles data commits

## Challenges
- Parsing GTFS-RT protobuf format for station-pair delay extraction across multiple Oslo region routes
- Mapping trip updates to specific station pairs in the Oslo region (Drammen-Oslo, Oslo-Gardemoen, connecting lines)
- Accurate delay calculation from stop time updates for bidirectional routes
- Aggregating station-pair data into meaningful route statistics for multiple route types
- Handling data gaps and incomplete trip information across expanded coverage area
- Optimizing database queries for station-pair aggregations
- Ensuring consistent station naming and ordering along routes

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

#### Station Data Structure
```json
{
  "station_code": "OSL",
  "station_name": "Oslo S",
  "avg_arrival_delay": 3.2,
  "avg_departure_delay": 2.8,
  "total_delays": 150,
  "delayed_percentage": 15.2,
  "date": "2026-01-05"
}
```

#### Route Data Structure
```json
{
  "route_name": "Drammen-Gardemoen",
  "avg_delay_minutes": 4.5,
  "total_stations": 9,
  "total_delays": 450,
  "delayed_percentage": 18.3,
  "date": "2026-01-05"
}
```

#### Station Pair Data Structure
```json
{
  "from_station": "Drammen",
  "to_station": "Oslo S",
  "avg_delay_minutes": 2.8,
  "total_trips": 120,
  "delayed_trips": 18,
  "delay_percentage": 15.0,
  "date": "2026-01-05"
}
```

#### Frontend State Management
- Use React hooks for view selection
- Cache JSON data in local storage for performance
- Implement loading states and error handling

## Next Steps

### Phase 1: Station/Route Discovery and Data Collection ✅ COMPLETED
1. ✅ Research and document all stations/routes in Oslo region (Drammen-Oslo, Oslo-Gardemoen, Oslo-Sandvika, Oslo-Asker, and opposite directions)
2. ✅ Update Python data fetcher to collect station-pair delay data for all major Oslo region routes
3. ✅ Modify database schema for station-based statistics (database setup script created, ready for deployment)
4. ✅ Generate initial JSON files with mock station/route data for expanded coverage

### Phase 2: Data Processing (Week 3) 🔄 IN PROGRESS
1. ✅ Implement station-level and route-level aggregation logic
2. ✅ Update JSON generation to support both views
3. 🔄 Test data processing pipeline with real API data (network connectivity issues in development environment, API integration code ready)

### Phase 3: Frontend Development (Week 4-5)
1. ⏳ Build React 19 SPA with TypeScript
2. ⏳ Implement station view with per-station delay charts
3. ⏳ Implement route view with average delay visualization
4. ⏳ Add view selector and time period controls

### Phase 4: Integration and Deployment (Week 6)
1. ✅ Set up cron job automation scripts and Docker database deployment
2. ⏳ Deploy frontend to GitHub Pages
3. ⏳ Test complete system integration
4. ⏳ Monitor and optimize performance