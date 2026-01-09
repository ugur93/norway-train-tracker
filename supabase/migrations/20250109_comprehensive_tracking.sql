-- Migration: Comprehensive Train Tracking
-- Adds support for tracking all trains (not just delayed), punctuality metrics, and region configuration

-- 1. Create stations reference table
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(50) UNIQUE NOT NULL,  -- NSR ID e.g., 'NSR:StopPlace:337'
    station_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    region VARCHAR(50) DEFAULT 'oslo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create routes configuration table
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'L1', 'R10', 'FLY1'
    route_name VARCHAR(255) NOT NULL,
    route_type VARCHAR(50) NOT NULL,  -- 'local', 'regional', 'airport_express'
    region VARCHAR(50) DEFAULT 'oslo',
    stations TEXT[],  -- Array of station IDs in order
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create train_departures table for raw data
CREATE TABLE IF NOT EXISTS train_departures (
    id SERIAL PRIMARY KEY,
    trip_id VARCHAR(255),
    route_id VARCHAR(50),
    route_code VARCHAR(20),
    station_id VARCHAR(50) NOT NULL,
    station_name VARCHAR(255),
    destination VARCHAR(255),
    scheduled_time TIMESTAMP NOT NULL,
    actual_time TIMESTAMP,
    delay_minutes DECIMAL(10, 2) DEFAULT 0,  -- Can be negative (early), 0 (on time), or positive (late)
    is_realtime BOOLEAN DEFAULT false,
    region VARCHAR(50) DEFAULT 'oslo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add new columns to daily_stats
ALTER TABLE daily_stats
ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'oslo';

-- 5. Add new columns to route_stats
ALTER TABLE route_stats
ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'oslo';

-- 6. Add new columns to hourly_stats
ALTER TABLE hourly_stats
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS total_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_trips INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS region VARCHAR(50) DEFAULT 'oslo';

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_train_departures_station ON train_departures(station_id);
CREATE INDEX IF NOT EXISTS idx_train_departures_route ON train_departures(route_code);
CREATE INDEX IF NOT EXISTS idx_train_departures_scheduled ON train_departures(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_train_departures_region ON train_departures(region);
CREATE INDEX IF NOT EXISTS idx_train_departures_created ON train_departures(created_at);

CREATE INDEX IF NOT EXISTS idx_stations_region ON stations(region);
CREATE INDEX IF NOT EXISTS idx_routes_region ON routes(region);
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(route_type);

CREATE INDEX IF NOT EXISTS idx_daily_stats_region ON daily_stats(region);
CREATE INDEX IF NOT EXISTS idx_route_stats_region ON route_stats(region);
CREATE INDEX IF NOT EXISTS idx_hourly_stats_region ON hourly_stats(region);

-- 8. Insert Oslo region stations
INSERT INTO stations (station_id, station_name, latitude, longitude, region) VALUES
    ('NSR:StopPlace:337', 'Oslo S', 59.9111, 10.7550, 'oslo'),
    ('NSR:StopPlace:58366', 'Skøyen', 59.9200, 10.6833, 'oslo'),
    ('NSR:StopPlace:418', 'Lysaker', 59.9128, 10.6350, 'oslo'),
    ('NSR:StopPlace:456', 'Sandvika', 59.8930, 10.5267, 'oslo'),
    ('NSR:StopPlace:444', 'Asker', 59.8333, 10.4378, 'oslo'),
    ('NSR:StopPlace:160', 'Drammen', 59.7440, 10.2045, 'oslo'),
    ('NSR:StopPlace:598', 'Oslo Lufthavn Stasjon', 60.1939, 11.1004, 'oslo'),
    ('NSR:StopPlace:550', 'Lillestrøm', 59.9550, 11.0492, 'oslo'),
    ('NSR:StopPlace:165', 'Eidsvoll', 60.3286, 11.1581, 'oslo'),
    ('NSR:StopPlace:588', 'Ski', 59.7194, 10.8389, 'oslo'),
    ('NSR:StopPlace:596', 'Spikkestad', 59.9467, 10.4100, 'oslo'),
    ('NSR:StopPlace:313', 'Kongsberg', 59.6686, 9.6502, 'oslo'),
    ('NSR:StopPlace:315', 'Kongsvinger', 60.1911, 12.0039, 'oslo'),
    ('NSR:StopPlace:416', 'Moss', 59.4344, 10.6572, 'oslo'),
    ('NSR:StopPlace:367', 'Lillehammer', 61.1153, 10.4662, 'oslo'),
    ('NSR:StopPlace:590', 'Skien', 59.2096, 9.6089, 'oslo'),
    ('NSR:StopPlace:220', 'Halden', 59.1222, 11.3875, 'oslo'),
    ('NSR:StopPlace:425', 'Mysen', 59.5536, 11.3258, 'oslo'),
    ('NSR:StopPlace:514', 'Rakkestad', 59.4286, 11.3450, 'oslo'),
    ('NSR:StopPlace:548', 'Sarpsborg', 59.2833, 11.1094, 'oslo'),
    ('NSR:StopPlace:196', 'Fredrikstad', 59.2181, 10.9298, 'oslo')
ON CONFLICT (station_id) DO UPDATE SET
    station_name = EXCLUDED.station_name,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude;

-- 9. Insert Oslo region routes
INSERT INTO routes (route_code, route_name, route_type, region, stations, description) VALUES
    ('L1', 'Spikkestad - Oslo S - Lillestrøm', 'local', 'oslo',
     ARRAY['NSR:StopPlace:596', 'NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:550', 'NSR:StopPlace:165'],
     'Oslo - Akershus (north-east)'),
    ('L2', 'Ski - Oslo S - Stabekk', 'local', 'oslo',
     ARRAY['NSR:StopPlace:588', 'NSR:StopPlace:337', 'NSR:StopPlace:58366'],
     'Oslo - Østfold (south-east) - Bærum (west)'),
    ('L12', 'Kongsberg - Oslo S - Eidsvoll', 'local', 'oslo',
     ARRAY['NSR:StopPlace:313', 'NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
     'Buskerud - Oslo - Akershus'),
    ('L13', 'Drammen - Oslo S - Dal', 'local', 'oslo',
     ARRAY['NSR:StopPlace:160', 'NSR:StopPlace:337'],
     'Buskerud - Oslo - Akershus'),
    ('L14', 'Asker - Oslo S - Kongsvinger', 'local', 'oslo',
     ARRAY['NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:315'],
     'Akershus - Oslo - Hedmark'),
    ('L21', 'Stabekk - Oslo S - Moss', 'local', 'oslo',
     ARRAY['NSR:StopPlace:58366', 'NSR:StopPlace:337', 'NSR:StopPlace:416'],
     'Bærum - Oslo - Østfold'),
    ('L22', 'Mysen - Oslo S - Stabekk', 'local', 'oslo',
     ARRAY['NSR:StopPlace:425', 'NSR:StopPlace:337', 'NSR:StopPlace:58366'],
     'Østfold - Oslo - Bærum'),
    ('R10', 'Drammen - Oslo S - Lillehammer', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:367'],
     'Buskerud - Oslo - Oppland'),
    ('R11', 'Skien - Oslo S - Eidsvoll', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:590', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
     'Telemark - Oslo - Akershus'),
    ('R12', 'Kongsberg - Oslo S - Eidsvoll', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:313', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
     'Buskerud - Oslo - Akershus'),
    ('R13', 'Drammen - Oslo S - Dal', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:160', 'NSR:StopPlace:337'],
     'Buskerud - Oslo - Akershus'),
    ('R14', 'Asker - Oslo S - Kongsvinger', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:315'],
     'Akershus - Oslo - Hedmark'),
    ('R20', 'Oslo S - Ski - Halden', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:337', 'NSR:StopPlace:588', 'NSR:StopPlace:220'],
     'Oslo - Østfold'),
    ('R21', 'Oslo S - Moss', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:337', 'NSR:StopPlace:416'],
     'Oslo - Østfold'),
    ('R22', 'Oslo S - Mysen - Rakkestad', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:337', 'NSR:StopPlace:425', 'NSR:StopPlace:514'],
     'Oslo - Østfold'),
    ('R23', 'Oslo S - Sarpsborg - Fredrikstad', 'regional', 'oslo',
     ARRAY['NSR:StopPlace:337', 'NSR:StopPlace:548', 'NSR:StopPlace:196'],
     'Oslo - Østfold'),
    ('FLY1', 'Oslo S - Oslo Lufthavn', 'airport_express', 'oslo',
     ARRAY['NSR:StopPlace:337', 'NSR:StopPlace:598'],
     'Oslo - Akershus (airport)'),
    ('FLY2', 'Drammen - Oslo S - Oslo Lufthavn', 'airport_express', 'oslo',
     ARRAY['NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:598'],
     'Buskerud - Oslo - Akershus (airport)')
ON CONFLICT (route_code) DO UPDATE SET
    route_name = EXCLUDED.route_name,
    stations = EXCLUDED.stations,
    description = EXCLUDED.description;

-- 10. Create view for route statistics with punctuality
CREATE OR REPLACE VIEW route_punctuality AS
SELECT
    r.route_code,
    r.route_name,
    r.route_type,
    r.region,
    COALESCE(rs.total_trips, 0) as total_trips,
    COALESCE(rs.on_time_trips, 0) as on_time_trips,
    COALESCE(rs.avg_delay_minutes, 0) as avg_delay_minutes,
    CASE
        WHEN COALESCE(rs.total_trips, 0) > 0
        THEN ROUND((COALESCE(rs.on_time_trips, 0)::DECIMAL / rs.total_trips) * 100, 1)
        ELSE 0
    END as punctuality_pct,
    rs.date
FROM routes r
LEFT JOIN route_stats rs ON r.route_code = rs.route_id
ORDER BY rs.date DESC, r.route_code;
