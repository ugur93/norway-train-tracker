# Frontend Mockup - Togforsinkelses Dashboard

## Oversikt
Denne HTML-mockupen demonstrerer det foreslåtte brukergrensesnittet for Togforsinkelses Dashboard for Oslo-regionen. Den viser to valgfrie visninger: individuelle stasjon-til-stasjon-forsinkelser og gjennomsnittlige rute-forsinkelser, ved hjelp av sanntidsdata fra Entur API. Brukere kan utforske forsinkelsesmønstre etter tidsperiode og få innsikt i togpålitelighet på tvers av større norske transportkorridorer inkludert Drammen-Oslo, Oslo-Gardemoen, og tilkoblingslinjer som Oslo-Sandvika og Oslo-Asker i begge retninger.

**Utplasseringsalternativer:**
- **Docker**: Full containerisert utplassering med `docker-compose.yml` (PostgreSQL + pgAdmin)
- **Native**: Tradisjonell serverutplassering med cron-automatisering
- **Hybrid**: JSON-only statisk hosting uten database-backend

**Nåværende status:** Backend-infrastruktur komplett med automatisert datainnsamling, databaseintegrasjon, og utplasseringsverktøy klar for produksjon.

### 📍 Stasjonsforsinkelser Visning
Viser både individuelle stasjonsforsinkelsesinformasjon og stasjon-til-stasjon-forsinkelsesinformasjon med sortering og filtrering:

#### Under-visninger
- **Individuelle Stasjoner**: Viser forsinkelsesytelse for hver stasjon på tvers av alle ruter
- **Stasjonspar**: Viser forsinkelsesytelse for spesifikke stasjon-til-stasjon-forbindelser

#### Kontroller (Gjelder Begge Under-visninger)
- **Tidsfilter**: Dropdown for å velge I Dag, Siste 7 Dager, eller Siste 30 Dager
- **Sorter etter**:
  - Størst Forsinkelse Først
  - Minst Forsinkelse Først
  - Stasjonsnavn A-Å
  - Stasjonsnavn Å-A

#### Individual Stations Sub-View
- **Station Cards**: Each shows station name, location/routes served, and average delay
- **Color Coding**: Green (0-3 min), Yellow (3-5 min), Red (5+ min)
- **Interactive Chart**: Bar chart showing delay distribution across stations

**Sample Stations (sorted by delay descending):**
```
Oslo Lufthavn    7.2 min avg delay  [RED - Airport • FLY1, FLY2 routes]
Ski              6.1 min avg delay  [RED - Østfold • L2, R20 routes]
Moss             5.8 min avg delay  [RED - Østfold • L21 route]
Drammen          4.7 min avg delay  [YELLOW - Buskerud • Multiple routes]
Lillehammer      4.2 min avg delay  [YELLOW - Oppland • R10 route]
Oslo S           3.2 min avg delay  [GREEN - Central Station • All routes]
Spikkestad       1.6 min avg delay  [GREEN - Akershus • L1 route]
```

#### Station-to-Station Delays Sub-View
- **Station Pair Cards**: Shows specific route segments with distance, scheduled time, and average delay
- **Route Information**: Displays which routes serve each station pair
- **Color Coding**: Same as individual stations (Green/Yellow/Red based on delay severity)
- **Interactive Chart**: Bar chart showing delay distribution across station pairs

**Sample Station Pairs (sorted by delay descending):**
```
Drammen → Asker        8.5 min avg delay  [RED - L12, L13 routes • 32km • 25 min scheduled]
Asker → Oslo S         7.8 min avg delay  [RED - L1, L14 routes • 23km • 22 min scheduled]
Oslo S → Lillestrøm    6.9 min avg delay  [RED - L1, L14 routes • 18km • 12 min scheduled]
Ski → Oslo S           6.2 min avg delay  [RED - L2, R20 routes • 24km • 22 min scheduled]
Moss → Oslo S          5.7 min avg delay  [RED - L21 route • 58km • 45 min scheduled]
Oslo S → Spikkestad    2.1 min avg delay  [GREEN - L1 route • 38km • 32 min scheduled]
```

### 🛤️ Route Averages View
Shows aggregated delay statistics for all 19 routes in the Oslo region:

**Local Trains:**
- L1: Spikkestad-Oslo S-Lillestrøm (3.5 min, 12 trips, 18% delayed)
- L2: Ski-Oslo S-Stabekk (4.2 min, 8 trips, 25% delayed)
- L12: Kongsberg-Oslo S-Eidsvoll (3.1 min, 6 trips, 15% delayed)
- L13: Drammen-Oslo S-Dal (2.8 min, 4 trips, 12% delayed)
- L21: Stabekk-Oslo S-Moss (4.0 min, 6 trips, 22% delayed)

**Regional Trains:**
- R10: Drammen-Oslo S-Lillehammer (4.2 min, 3 trips, 20% delayed)
- R11: Skien-Oslo S-Eidsvoll (2.9 min, 2 trips, 10% delayed)
- R20: Oslo S-Ski-Halden (2.5 min, 4 trips, 8% delayed)

**Airport Express:**
- FLY1: Oslo S-Oslo Lufthavn (2.4 min, 15 trips, 5% delayed)
- FLY2: Drammen-Oslo S-Oslo Lufthavn (5.4 min, 8 trips, 28% delayed) [HIGHLIGHTED]

### 📈 Analytics View
Advanced statistics and insights for deeper delay pattern analysis:

#### Peak Hour Performance
- Rush Hour (7-9 AM): 6.8 min average delay (+12% vs off-peak)
- Evening Peak (4-6 PM): 5.2 min average delay (+8% vs off-peak)
- Off-Peak (10 AM-3 PM): 3.1 min average delay (baseline)
- Late Night (10 PM-5 AM): 2.4 min average delay (-22% vs peak)

#### Day of Week Patterns
- Monday-Friday: 6.3-7.9 min average delays (peak days)
- Wednesday-Thursday: 6.7-7.1 min average delays (midweek)
- Saturday-Sunday: 2.9-3.8 min average delays (weekend)

#### Reliability Metrics
- On-Time Rate: 87.3% (trains within 3 minutes of schedule)
- Delay Consistency: 2.1 min standard deviation
- Recovery Time: 18 min average time to return to normal service
- Daily Impact: 12,450 passengers affected by delays

#### Trend Analysis
- 30-Day Trend: ↘️ -8.2% improvement in average delays
- vs Last Month: ↗️ +15.3% change
- Best Month: November (2.8 min average)

#### Predictive Insights
- L1 Route: 65% chance of >5 min delay (weather forecast: snow expected)
- FLY1 Route: 25% chance of >5 min delay (historical pattern: good reliability)
- R10 Route: 45% chance of >5 min delay (weekend schedule: reduced frequency)

#### Økonomisk Påvirkning
- Daglig Tapt Tid: 47,200 passasjerforsinkelsesminutter
- Daglig Kostnad: NOK 1,270,000 (NOK 27 per forsinkelsesminutt)
- CO₂ Påvirkning: 2.3 tonn ekstra drivstofforbruk

## Design Elements

### Color Coding
- 🟢 Green: Normal delays (< 3 minutes)
- 🟡 Yellow: Moderate delays (3-5 minutes)
- 🔴 Red: Severe delays (> 5 minutes)

### Interactive Elements
- Time period selectors (Today, Last 7 Days, Last 30 Days)
- View toggles (Station Delays, Route Averages, Analytics)
- Responsive design for mobile and desktop
- Hover effects and smooth transitions
- Route type categorization (Local, Regional, Airport Express)

### Interactive Chart Mockups
- **Delay Distribution Bar Chart**: Shows average delay minutes for key station pairs across all routes
  - Color-coded bars (green: 0-3 min, yellow: 3-5 min, red: 5+ min)
  - Hover tooltips with exact delay values
  - Grid lines and axis labels for professional appearance
- **Route Comparison Line Chart**: Multi-series line chart showing delay trends over time
  - Four route series (L1, L2, FLY1, FLY2) with distinct colors
  - Time-based x-axis (6-hour intervals)
  - Interactive data points with hover effects
  - SVG-based smooth line rendering
- **Chart Legends**: Color-coded legends for both charts
- Ready for Chart.js or D3.js integration with identical data structures

## Technical Implementation Notes

### Data Sources
- Uses actual JSON data from `tmp/daily_stats.json` and `tmp/route_stats.json`
- Demonstrates real data structure and formatting
- Shows how frontend would consume GitHub-hosted JSON files

### Responsive Design
- Mobile-first approach
- Grid layout that adapts to screen size
- Touch-friendly interface elements

### Accessibility
- Semantic HTML structure
- High contrast color schemes
- Keyboard navigation support

## Next Steps for Actual Implementation

1. **React 19 Setup**: Create TypeScript React application with three main views
2. **Analytics Components**: Implement peak hour analysis, reliability metrics, trend charts, and predictive insights
3. **Data Fetching**: Implement axios/fetch for loading JSON files from GitHub repository
4. **Advanced Charting**: Add Chart.js/D3.js for heatmaps, trend lines, radar charts, and histograms
5. **State Management**: Add React hooks for view switching and analytics state
6. **Styling**: Convert to CSS modules or styled-components
7. **Deployment**: Set up GitHub Pages hosting

Denne mockupen gir en komplett visjon for det endelige dashboardet med tre distinkte visninger: Stasjonsforsinkelser for detaljert ytelse, Rute Gjennomsnitt for høyt nivå oversikt, og Analyse for dyp innsikt og prediksjoner.