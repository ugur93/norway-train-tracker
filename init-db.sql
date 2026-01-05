-- Initialize Train Delays Database
-- This script runs automatically when the PostgreSQL container starts

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
    station_code VARCHAR(10) PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL,
    latitude FLOAT,
    longitude FLOAT,
    station_order INTEGER
);

-- Create station_pair_delays table
CREATE TABLE IF NOT EXISTS station_pair_delays (
    id SERIAL PRIMARY KEY,
    trip_id VARCHAR(255),
    route_id VARCHAR(255),
    from_station VARCHAR(10),
    to_station VARCHAR(10),
    scheduled_departure TIMESTAMP,
    actual_departure TIMESTAMP,
    delay_minutes INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_station_stats table
CREATE TABLE IF NOT EXISTS daily_station_stats (
    id SERIAL PRIMARY KEY,
    from_station VARCHAR(10),
    to_station VARCHAR(10),
    date DATE,
    avg_delay_minutes FLOAT,
    total_trips INTEGER,
    delayed_trips INTEGER,
    delay_percentage FLOAT,
    UNIQUE(from_station, to_station, date)
);

-- Create daily_route_stats table
CREATE TABLE IF NOT EXISTS daily_route_stats (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255),
    date DATE,
    avg_delay_minutes FLOAT,
    total_trips INTEGER,
    delayed_trips INTEGER,
    delay_percentage FLOAT,
    UNIQUE(route_name, date)
);

-- Create hourly_station_stats table
CREATE TABLE IF NOT EXISTS hourly_station_stats (
    id SERIAL PRIMARY KEY,
    from_station VARCHAR(10),
    to_station VARCHAR(10),
    hour INTEGER,
    avg_delay_minutes FLOAT,
    total_trips INTEGER,
    delayed_trips INTEGER,
    delay_percentage FLOAT,
    UNIQUE(from_station, to_station, hour)
);

-- Create hourly_route_stats table
CREATE TABLE IF NOT EXISTS hourly_route_stats (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(255),
    hour INTEGER,
    avg_delay_minutes FLOAT,
    total_trips INTEGER,
    delayed_trips INTEGER,
    delay_percentage FLOAT,
    UNIQUE(route_name, hour)
);

-- Insert initial station data for Oslo region
INSERT INTO stations (station_code, station_name, latitude, longitude, station_order)
VALUES
    ('Drammen', 'Drammen', 59.7440, 10.2045, 1),
    ('Sandvika', 'Sandvika', 59.8930, 10.5267, 2),
    ('Asker', 'Asker', 59.8333, 10.4378, 3),
    ('Oslo S', 'Oslo Central Station', 59.9111, 10.7550, 4),
    ('Lillestrøm', 'Lillestrøm', 59.9550, 11.0492, 5),
    ('OSL', 'Oslo Lufthavn', 60.1939, 11.1004, 6)
ON CONFLICT (station_code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_station_pair_delays_recorded_at ON station_pair_delays(recorded_at);
CREATE INDEX IF NOT EXISTS idx_station_pair_delays_route ON station_pair_delays(route_id);
CREATE INDEX IF NOT EXISTS idx_daily_station_stats_date ON daily_station_stats(date);
CREATE INDEX IF NOT EXISTS idx_daily_route_stats_date ON daily_route_stats(date);