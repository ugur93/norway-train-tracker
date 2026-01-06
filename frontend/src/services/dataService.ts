import { createClient } from '@supabase/supabase-js'
import type { StationDelay, RouteStats, HourlyStats } from '../types'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)

class DataService {
  async fetchStationDelays(): Promise<StationDelay[]> {
    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        console.error('Error fetching station delays:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching station delays:', error)
      return []
    }
  }

  async fetchRouteStats(): Promise<RouteStats[]> {
    try {
      const { data, error } = await supabase
        .from('route_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        console.error('Error fetching route stats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching route stats:', error)
      return []
    }
  }

  async fetchHourlyStats(): Promise<HourlyStats[]> {
    try {
      const { data, error } = await supabase
        .from('hourly_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        console.error('Error fetching hourly stats:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching hourly stats:', error)
      return []
    }
  }
}

export const dataService = new DataService()