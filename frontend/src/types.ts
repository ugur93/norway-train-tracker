export interface StationDelay {
  date: string;
  from_stop: string;
  to_stop: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  is_relevant: boolean;
}

export interface RouteStats {
  date: string;
  route_id: string;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
  route_name: string;
}

export interface HourlyStats {
  date: string;
  hour: number;
  avg_delay_minutes: number;
  total_delay_minutes: number;
  delay_count: number;
}

export type TimeFilter = 'today' | '7days' | '30days';
export type SortOption = 'delay_desc' | 'delay_asc' | 'name_asc' | 'name_desc';
export type ViewType = 'stations' | 'routes' | 'analytics';
export type StationViewType = 'individual' | 'pairs';

export interface DelayColor {
  bg: string;
  text: string;
  border: string;
}

export const getDelayColor = (delay: number): DelayColor => {
  if (delay < 3) {
    // Good delay - green
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-700 dark:text-green-300',
      border: 'border-green-500'
    };
  } else if (delay < 5) {
    // Moderate delay - yellow/orange
    return {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      text: 'text-yellow-700 dark:text-yellow-300',
      border: 'border-yellow-500'
    };
  } else {
    // High delay - red
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-500'
    };
  }
};