# Train Delay Dashboard

A comprehensive dashboard visualizing train delay statistics for the entire Oslo region in Norway, covering all local, regional, and airport express train routes.

## Features

- **Real-time Data**: Fetches live train delay data from Entur's open GTFS-RT API
- **Station-Pair Analysis**: Shows delays between consecutive stations across all Oslo region routes
- **Route Aggregation**: Displays average delays for all 19 train routes in the Oslo region
- **Selectable Views**: Toggle between station-specific delays and route-wide averages
- **Historical Data**: Tracks daily and hourly delay patterns
- **Static Hosting**: JSON-based data flow enables deployment on GitHub Pages/Netlify
- **Flexible Configuration**: Easy to add new routes and stations as the network expands

## Architecture

- **Data Collection**: Python script fetches GTFS-RT data every 30-60 seconds
- **Database**: PostgreSQL stores raw delays and aggregated statistics for 21 stations
- **Data Storage**: JSON files committed to GitHub for static frontend access
- **Frontend**: React 19 SPA with TypeScript (planned)
- **Hosting**: Cron jobs on server, static frontend on GitHub Pages
- **Configuration**: Centralized route and station configuration for easy maintenance

## Routes Covered

**Local Trains (L-series):**
- L1: Spikkestad - Oslo S - Lillestrøm (Akershus region)
- L2: Ski - Oslo S - Stabekk (Østfold-Bærum)
- L12: Kongsberg - Oslo S - Eidsvoll (Buskerud-Akershus)
- L13: Drammen - Oslo S - Dal (Buskerud-Akershus)
- L14: Asker - Oslo S - Kongsvinger (Akershus-Hedmark)
- L21: Stabekk - Oslo S - Moss (Bærum-Østfold)
- L22: Mysen - Oslo S - Stabekk (Østfold-Bærum)

**Regional Trains (R-series):**
- R10: Drammen - Oslo S - Lillehammer (Oppland route)
- R11: Skien - Oslo S - Eidsvoll (Telemark-Akershus)
- R12: Kongsberg - Oslo S - Eidsvoll (Buskerud-Akershus)
- R13: Drammen - Oslo S - Dal (Buskerud-Akershus)
- R14: Asker - Oslo S - Kongsvinger (Akershus-Hedmark)
- R20: Oslo S - Ski - Halden (Østfold route)
- R21: Oslo S - Moss - Göteborg (Østfold-Sweden)
- R22: Oslo S - Mysen - Rakkestad (Østfold route)
- R23: Oslo S - Sarpsborg - Fredrikstad (Østfold route)

**Airport Express Trains:**
- FLY1: Oslo S - Oslo Lufthavn (Direct to airport)
- FLY2: Drammen - Oslo S - Oslo Lufthavn (Via Drammen)

**Coverage:** 21 stations, 45+ station pairs, 19 routes, serving Buskerud, Akershus, Østfold, Oppland, Telemark, and Hedmark regions.

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL (optional, for full database functionality)
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd togforsinkelser
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   Create a `.env` file with database credentials (if using PostgreSQL):
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=train_delays
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Database Setup (Optional)

Choose one of the following database setup options:

#### Option 1: Docker Compose (Recommended)
```bash
# Start PostgreSQL database with pgAdmin
docker-compose up -d

# Database will be available at:
# - PostgreSQL: localhost:5432
# - pgAdmin: http://localhost:8080 (admin@traindelays.local / admin123)
```

#### Option 2: Native PostgreSQL
```bash
# Install and start PostgreSQL
brew install postgresql  # macOS
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian

# Create database and tables
python3 setup_database.py
```

### Automated Data Collection

Set up automated data collection using cron jobs:

```bash
# Run the cron setup script
./setup_cron.sh
```

This will provide an interactive menu to:
- Add cron jobs (30 minutes, hourly, or daily)
- Remove existing cron jobs
- Test the automation script manually
- List current cron jobs

The cron job will run `run_data_fetcher.sh` which executes the data fetcher with database integration.

### Environment Configuration

- **Local development**: Use default `.env` file (if PostgreSQL is installed locally)
- **Docker deployment**: Use `docker-env` file for Docker Compose database setup
- **No database**: Run without `--use-db` flag for JSON-only operation

### Testing

1. **Test API integration:**
   ```bash
   python3 test_api_integration.py
   ```

2. **Run data fetcher with mock data:**
   ```bash
   python3 data_fetcher.py
   ```

3. **Run data fetcher with database (if PostgreSQL is set up):**
   ```bash
   python3 data_fetcher.py --use-db
   ```

## Data Fetcher

The `data_fetcher.py` script:

- Fetches real-time GTFS-RT data from Entur API
- Processes station-pair delays for Oslo region routes
- Generates JSON files for frontend consumption
- Optionally saves data to PostgreSQL database

### Generated JSON Files

- `station_delays.json`: Raw station-pair delay data
- `daily_stats.json`: Daily aggregated statistics by station pair
- `hourly_stats.json`: Hourly patterns by station pair
- `route_stats.json`: Route-level aggregated statistics

## Development Status

### ✅ Completed
- **Phase 1**: Station/route discovery and data collection
- **Phase 2**: Data processing pipeline (core functionality)
- Database schema design and setup scripts
- API integration testing framework
- JSON generation for static hosting

### 🔄 In Progress
- **Phase 2**: Real API data testing (network-dependent)
- **Phase 3**: React frontend development

### ⏳ Planned
- **Phase 4**: Deployment and automation
- Cron job setup for automated data collection
- GitHub Pages frontend deployment

## API Information

- **Source**: Entur Real-Time API (open access, no authentication required)
- **Format**: GTFS-RT (Protocol Buffers)
- **Endpoints**:
  - Trip Updates: `https://api.entur.org/realtime/v1/gtfs-rt/trip-updates`
  - Vehicle Positions: `https://api.entur.org/realtime/v1/gtfs-rt/vehicle-positions`

## Frontend Mockup

Preview the proposed dashboard interface:

```bash
open frontend_mockup.html
```

The `frontend_mockup.html` file demonstrates the complete user interface with:
- Station Delays view showing individual station delays with sorting and time filtering
- Route Averages view showing aggregated route statistics
- **Interactive Chart Mockups**: Detailed bar and line charts showing delay distributions and route comparisons
- Interactive view switching and time period selection
- Responsive design for mobile and desktop
- Real data integration from generated JSON files

See `FRONTEND_MOCKUP_README.md` for detailed design specifications.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. Please check the license file for details.

## Data Privacy

This project uses only publicly available transportation data from Entur's open APIs. No personal or sensitive data is collected or stored.