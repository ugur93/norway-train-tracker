import { createClient } from '@supabase/supabase-js'
import type {
  StationDelay,
  RouteStats,
  HourlyStats,
  Route,
  Station,
  SystemHealth,
  RouteWithPunctuality
} from '../types'

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
  // Fetch station delays (daily_stats)
  async fetchStationDelays(_region: string = 'oslo'): Promise<StationDelay[]> {
    try {
      const { data, error } = await supabase
        .from('daily_stats')
        .select('*')
        .order('date', { ascending: false })
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

  // Fetch route statistics
  async fetchRouteStats(_region: string = 'oslo'): Promise<RouteStats[]> {
    try {
      const { data, error } = await supabase
        .from('route_stats')
        .select('*')
        .order('date', { ascending: false })
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

  // Fetch route stats with punctuality calculated
  async fetchRoutesWithPunctuality(region: string = 'oslo'): Promise<RouteWithPunctuality[]> {
    try {
      const routeStats = await this.fetchRouteStats(region)

      return routeStats.map(route => ({
        ...route,
        punctuality_pct: route.total_trips > 0
          ? Math.round((route.on_time_trips / route.total_trips) * 100)
          : 0,
        route_type: this.getRouteType(route.route_id)
      }))
    } catch (error) {
      console.error('Error fetching routes with punctuality:', error)
      return []
    }
  }

  // Fetch hourly statistics
  async fetchHourlyStats(_region: string = 'oslo'): Promise<HourlyStats[]> {
    try {
      const { data, error } = await supabase
        .from('hourly_stats')
        .select('*')
        .order('date', { ascending: false })
        .order('hour', { ascending: true })
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

  // Fetch route configurations
  async fetchRoutes(region: string = 'oslo'): Promise<Route[]> {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('region', region)
        .order('route_code', { ascending: true })

      if (error) {
        console.error('Error fetching routes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching routes:', error)
      return []
    }
  }

  // Fetch station configurations
  async fetchStations(region: string = 'oslo'): Promise<Station[]> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('region', region)
        .order('station_name', { ascending: true })

      if (error) {
        console.error('Error fetching stations:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching stations:', error)
      return []
    }
  }

  // Calculate system health from route stats
  async fetchSystemHealth(_region: string = 'oslo'): Promise<SystemHealth> {
    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0]

      // Fetch route stats for today
      const { data: routeData, error: routeError } = await supabase
        .from('route_stats')
        .select('*')
        .gte('date', today)

      if (routeError) {
        console.error('Error fetching route stats for health:', routeError)
      }

      const routes = routeData || []

      // Calculate totals
      const totalTrips = routes.reduce((sum, r) => sum + (r.total_trips || 0), 0)
      const onTimeTrips = routes.reduce((sum, r) => sum + (r.on_time_trips || 0), 0)
      const totalDelay = routes.reduce((sum, r) => sum + (r.total_delay_minutes || 0), 0)
      const delayCount = routes.reduce((sum, r) => sum + (r.delay_count || 0), 0)

      return {
        totalTrips,
        onTimeTrips,
        punctualityPct: totalTrips > 0 ? Math.round((onTimeTrips / totalTrips) * 100) : 0,
        avgDelayMinutes: delayCount > 0 ? Math.round((totalDelay / delayCount) * 10) / 10 : 0,
        activeRoutes: new Set(routes.map(r => r.route_id)).size,
        delayedTrips: totalTrips - onTimeTrips
      }
    } catch (error) {
      console.error('Error fetching system health:', error)
      return {
        totalTrips: 0,
        onTimeTrips: 0,
        punctualityPct: 0,
        avgDelayMinutes: 0,
        activeRoutes: 0,
        delayedTrips: 0
      }
    }
  }

  // Get top delayed routes
  async fetchTopDelayedRoutes(limit: number = 5, region: string = 'oslo'): Promise<RouteWithPunctuality[]> {
    const routes = await this.fetchRoutesWithPunctuality(region)

    // Sort by average delay (descending) and take top N
    return routes
      .sort((a, b) => b.avg_delay_minutes - a.avg_delay_minutes)
      .slice(0, limit)
  }

  // Get top delayed station pairs
  async fetchTopDelayedStations(limit: number = 10, region: string = 'oslo'): Promise<StationDelay[]> {
    const stations = await this.fetchStationDelays(region)

    // Sort by average delay (descending) and take top N
    return stations
      .sort((a, b) => b.avg_delay_minutes - a.avg_delay_minutes)
      .slice(0, limit)
  }

  // Filter data by time period
  filterByTime<T extends { date: string }>(items: T[], filter: string): T[] {
    const now = new Date()
    const filterDate = new Date()

    switch (filter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0)
        break
      case '24hours':
        filterDate.setHours(now.getHours() - 24)
        break
      case '7days':
        filterDate.setDate(now.getDate() - 7)
        break
      case '30days':
        filterDate.setDate(now.getDate() - 30)
        break
      default:
        filterDate.setDate(now.getDate() - 1)
    }

    return items.filter(item => new Date(item.date) >= filterDate)
  }

  // Aggregate station delays by station pair (sum across dates)
  aggregateStationDelays(items: StationDelay[]): StationDelay[] {
    const grouped = new Map<string, StationDelay>()

    for (const item of items) {
      const key = `${item.from_stop}_${item.to_stop}`

      if (!grouped.has(key)) {
        grouped.set(key, { ...item })
      } else {
        const existing = grouped.get(key)!
        existing.total_trips += item.total_trips
        existing.on_time_trips += item.on_time_trips
        existing.total_delay_minutes += item.total_delay_minutes
        existing.delay_count += item.delay_count
        existing.avg_delay_minutes = existing.delay_count > 0
          ? existing.total_delay_minutes / existing.delay_count
          : 0
      }
    }

    return Array.from(grouped.values())
  }

  // Aggregate route stats (sum across dates)
  aggregateRouteStats(items: RouteStats[]): RouteWithPunctuality[] {
    const grouped = new Map<string, RouteStats>()

    for (const item of items) {
      const key = item.route_id

      if (!grouped.has(key)) {
        grouped.set(key, { ...item })
      } else {
        const existing = grouped.get(key)!
        existing.total_trips += item.total_trips
        existing.on_time_trips += item.on_time_trips
        existing.total_delay_minutes += item.total_delay_minutes
        existing.delay_count += item.delay_count
        existing.avg_delay_minutes = existing.delay_count > 0
          ? existing.total_delay_minutes / existing.delay_count
          : 0
      }
    }

    return Array.from(grouped.values()).map(route => ({
      ...route,
      punctuality_pct: route.total_trips > 0
        ? Math.round((route.on_time_trips / route.total_trips) * 100)
        : 0,
      route_type: this.getRouteType(route.route_id)
    }))
  }

  // Helper to determine route type from route code
  private getRouteType(routeCode: string): string {
    if (routeCode.startsWith('FLY') || routeCode.includes('Flytoget')) return 'airport_express'
    if (routeCode.startsWith('L')) return 'local'
    if (routeCode.startsWith('R')) return 'regional'
    return 'other'
  }
}

export const dataService = new DataService()
