-- Add start and end station columns to route_stats table
-- These will store the actual route endpoints from Entur API

ALTER TABLE route_stats
ADD COLUMN IF NOT EXISTS start_station TEXT,
ADD COLUMN IF NOT EXISTS end_station TEXT;

-- Update the routes table to also include start and end stations
ALTER TABLE routes
ADD COLUMN IF NOT EXISTS start_station TEXT,
ADD COLUMN IF NOT EXISTS end_station TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_route_stats_route_id ON route_stats(route_id);

-- Comment on columns
COMMENT ON COLUMN route_stats.start_station IS 'Start station name from Entur API';
COMMENT ON COLUMN route_stats.end_station IS 'End station name from Entur API';
COMMENT ON COLUMN routes.start_station IS 'First station on the route';
COMMENT ON COLUMN routes.end_station IS 'Last station on the route';
