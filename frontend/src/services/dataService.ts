import { createClient } from '@supabase/supabase-js'
import type { StationDelay, RouteStats, HourlyStats } from '../types'

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
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