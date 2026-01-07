export interface StationDelay {
  date: string;
  from_stop: string;
  from_stop_name: string;
  to_stop: string;
  to_stop_name: string;
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
  from_stop: string;
  from_stop_name: string;
  to_stop: string;
  to_stop_name: string;
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
  // Simplified: use minimal colors, just text color for status
  if (delay < 3) {
    return {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    };
  } else if (delay < 5) {
    return {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    };
  } else {
    return {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    };
  }
};