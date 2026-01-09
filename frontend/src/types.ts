// Station delay data from daily_stats table
export interface StationDelay {
  date: string;
  from_stop: string;
  from_stop_name: string;
  to_stop: string;
  to_stop_name: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  total_trips: number;
  on_time_trips: number;
  is_relevant: boolean;
  region?: string;
}

// Route statistics from route_stats table
export interface RouteStats {
  date: string;
  route_id: string;
  route_name: string;
  start_station: string;
  end_station: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  total_trips: number;
  on_time_trips: number;
  region?: string;
}

// Hourly statistics from hourly_stats table
export interface HourlyStats {
  date: string;
  hour: number;
  from_stop: string;
  from_stop_name: string;
  to_stop: string;
  to_stop_name: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  total_trips: number;
  on_time_trips: number;
  region?: string;
}

// Raw train departure data
export interface TrainDeparture {
  id: number;
  trip_id: string;
  route_id: string;
  route_code: string;
  station_id: string;
  station_name: string;
  destination: string;
  scheduled_time: string;
  actual_time: string | null;
  delay_minutes: number;
  is_realtime: boolean;
  region: string;
  created_at: string;
}

// Route configuration
export interface Route {
  id: number;
  route_code: string;
  route_name: string;
  route_type: 'local' | 'regional' | 'airport_express';
  region: string;
  stations: string[];
  description: string;
}

// Station configuration
export interface Station {
  id: number;
  station_id: string;
  station_name: string;
  latitude: number;
  longitude: number;
  region: string;
}

// Filter and sort options
export type TimeFilter = 'today' | '24hours' | '7days' | '30days';
export type SortOption = 'delay_desc' | 'delay_asc' | 'name_asc' | 'name_desc' | 'punctuality_asc' | 'punctuality_desc';
export type ViewType = 'overview' | 'routes' | 'stations' | 'analytics';
export type StationViewType = 'individual' | 'pairs';
export type RouteTypeFilter = 'all' | 'local' | 'regional' | 'airport_express';

// Aggregated route statistics with punctuality
export interface RouteWithPunctuality extends RouteStats {
  punctuality_pct: number;
  route_type?: string;
}

// System health summary
export interface SystemHealth {
  totalTrips: number;
  onTimeTrips: number;
  punctualityPct: number;
  avgDelayMinutes: number;
  activeRoutes: number;
  delayedTrips: number;
}

// Delay color helper
export interface DelayColor {
  bg: string;
  text: string;
  border: string;
}

export const getDelayColor = (delay: number): DelayColor => {
  if (delay < 3) {
    return {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20'
    };
  } else if (delay < 5) {
    return {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20'
    };
  } else {
    return {
      bg: 'bg-danger/10',
      text: 'text-danger',
      border: 'border-danger/20'
    };
  }
};

// Punctuality color helper
export const getPunctualityColor = (pct: number): DelayColor => {
  if (pct >= 90) {
    return {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20'
    };
  } else if (pct >= 75) {
    return {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20'
    };
  } else {
    return {
      bg: 'bg-danger/10',
      text: 'text-danger',
      border: 'border-danger/20'
    };
  }
};

// Calculate punctuality percentage
export const calculatePunctuality = (totalTrips: number, onTimeTrips: number): number => {
  if (totalTrips === 0) return 0;
  return Math.round((onTimeTrips / totalTrips) * 100);
};

// Route type display names (Norwegian)
export const getRouteTypeDisplay = (type: string): string => {
  switch (type) {
    case 'local': return 'Lokaltog';
    case 'regional': return 'Regiontog';
    case 'airport_express': return 'Flytoget';
    default: return type;
  }
};

// Route type icon
export const getRouteTypeIcon = (routeCode: string): string => {
  if (routeCode.startsWith('FLY') || routeCode.includes('Flytoget')) return 'flight';
  if (routeCode.startsWith('L')) return 'directions_railway';
  if (routeCode.startsWith('R')) return 'train';
  return 'train';
};
