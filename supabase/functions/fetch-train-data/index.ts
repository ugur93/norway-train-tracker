// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import {
  OSLO_REGION,
  getStationIds,
  getStationName,
  isRegionRoute,
  extractRouteCode,
  getRouteInfo,
  ON_TIME_THRESHOLD_MINUTES,
  type RegionConfig
} from './regions.ts'

interface StationDelay {
  date: string
  from_stop: string
  from_stop_name: string
  to_stop: string
  to_stop_name: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  total_trips: number
  on_time_trips: number
  is_relevant: boolean
  region: string
}

interface RouteStat {
  date: string
  route_id: string
  route_name: string
  start_station: string
  end_station: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  total_trips: number
  on_time_trips: number
  region: string
}

interface HourlyStat {
  date: string
  hour: number
  from_stop: string
  from_stop_name: string
  to_stop: string
  to_stop_name: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  total_trips: number
  on_time_trips: number
  is_relevant: boolean
  region: string
}

interface TrainDeparture {
  trip_id: string
  route_id: string
  route_code: string
  station_id: string
  station_name: string
  destination: string
  scheduled_time: string
  actual_time: string | null
  delay_minutes: number
  is_realtime: boolean
  region: string
}

interface LineInfo {
  id: string
  name: string
  publicCode: string
  startStation: string
  endStation: string
}

// Parse start and end stations from line name (e.g., "Kongsberg-Oslo S-Eidsvoll" -> start: Kongsberg, end: Eidsvoll)
function parseLineEndpoints(lineName: string): { start: string; end: string } {
  const parts = lineName.split('-').map(p => p.trim())
  if (parts.length >= 2) {
    return { start: parts[0], end: parts[parts.length - 1] }
  }
  return { start: lineName, end: lineName }
}

// Fetch line information from Entur API
async function fetchLineInfo(routeCodes: string[]): Promise<Map<string, LineInfo>> {
  const lineMap = new Map<string, LineInfo>()

  if (routeCodes.length === 0) return lineMap

  const codesString = routeCodes.map(c => `"${c}"`).join(', ')
  const query = `{ lines(publicCodes: [${codesString}]) { id name publicCode } }`

  try {
    const response = await fetch('https://api.entur.io/journey-planner/v3/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ET-Client-Name': 'norway-train-tracker',
        'ET-Client-Id': 'norway-train-tracker-1.0'
      },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      console.error('Error fetching line info:', response.status)
      return lineMap
    }

    const data = await response.json()
    const lines = data?.data?.lines || []

    for (const line of lines) {
      const endpoints = parseLineEndpoints(line.name)
      lineMap.set(line.publicCode, {
        id: line.id,
        name: line.name,
        publicCode: line.publicCode,
        startStation: endpoints.start,
        endStation: endpoints.end
      })
    }

    console.log(`Fetched info for ${lineMap.size} lines from Entur API`)
  } catch (error) {
    console.error('Error fetching line info:', error)
  }

  return lineMap
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const region = OSLO_REGION
    console.log(`Fetching train data for ${region.name}...`)

    // Get all station IDs for this region
    const stationIds = getStationIds(region.id)

    // Fetch line information from Entur API
    const lineInfoMap = await fetchLineInfo(region.routeCodes)

    const allDepartures: TrainDeparture[] = []
    const allStationStats: StationDelay[] = []
    const allRouteStats: RouteStat[] = []
    const allHourlyStats: HourlyStat[] = []

    // Fetch data from each station
    for (const stationId of stationIds) {
      const graphqlQuery = `
        {
          stopPlace(id: "${stationId}") {
            id
            name
            estimatedCalls(numberOfDepartures: 100, timeRange: 86400) {
              realtime
              aimedDepartureTime
              expectedDepartureTime
              serviceJourney {
                id
                line {
                  id
                  publicCode
                }
              }
              destinationDisplay {
                frontText
              }
              quay {
                id
                publicCode
              }
            }
          }
        }
      `

      try {
        const response = await fetch('https://api.entur.io/journey-planner/v3/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ET-Client-Name': 'norway-train-tracker',
            'ET-Client-Id': 'norway-train-tracker-1.0'
          },
          body: JSON.stringify({ query: graphqlQuery })
        })

        if (!response.ok) {
          console.error(`Entur API error for ${stationId}: ${response.status}`)
          continue
        }

        const data = await response.json()

        if (!data || !data.data || !data.data.stopPlace) {
          console.warn(`No valid stopPlace data for ${stationId}, skipping...`)
          continue
        }

        const { departures, stationStats, routeStats, hourlyStats } = processGraphQLData(data, region, lineInfoMap)

        allDepartures.push(...departures)
        allStationStats.push(...stationStats)
        allRouteStats.push(...routeStats)
        allHourlyStats.push(...hourlyStats)
      } catch (error) {
        console.error(`Error fetching data for ${stationId}:`, error)
      }
    }

    console.log(`Total processed: ${allDepartures.length} departures, ${allStationStats.length} station stats, ${allRouteStats.length} route stats`)

    // Store raw departures
    if (allDepartures.length > 0) {
      const { error } = await supabase
        .from('train_departures')
        .insert(allDepartures)

      if (error) {
        console.error('Error inserting departures:', error)
      } else {
        console.log(`Inserted ${allDepartures.length} departures`)
      }
    }

    // Aggregate and store daily stats
    const aggregatedStationStats = aggregateStationStats(allStationStats)
    for (const stat of aggregatedStationStats) {
      await upsertDailyStat(supabase, stat)
    }
    console.log(`Processed ${aggregatedStationStats.length} daily station stats`)

    // Aggregate and store route stats
    const aggregatedRouteStats = aggregateRouteStats(allRouteStats)
    for (const stat of aggregatedRouteStats) {
      await upsertRouteStat(supabase, stat)
    }
    console.log(`Processed ${aggregatedRouteStats.length} route stats`)

    // Aggregate and store hourly stats
    const aggregatedHourlyStats = aggregateHourlyStats(allHourlyStats)
    for (const stat of aggregatedHourlyStats) {
      await upsertHourlyStat(supabase, stat)
    }
    console.log(`Processed ${aggregatedHourlyStats.length} hourly stats`)

    return new Response(JSON.stringify({
      success: true,
      region: region.id,
      departures_count: allDepartures.length,
      station_stats_count: aggregatedStationStats.length,
      route_stats_count: aggregatedRouteStats.length,
      hourly_stats_count: aggregatedHourlyStats.length,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in fetch-train-data function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

function processGraphQLData(data: any, region: RegionConfig, lineInfoMap: Map<string, LineInfo>): {
  departures: TrainDeparture[],
  stationStats: StationDelay[],
  routeStats: RouteStat[],
  hourlyStats: HourlyStat[]
} {
  const departures: TrainDeparture[] = []
  const stationStats: StationDelay[] = []
  const hourlyStats: HourlyStat[] = []
  const routeStatsMap = new Map<string, RouteStat>()
  const currentDate = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  const stopPlace = data.data.stopPlace
  const calls = stopPlace.estimatedCalls || []

  console.log(`Processing ${calls.length} estimated calls from ${stopPlace.name}`)

  // Process each estimated call - ALL trains, not just delayed ones
  for (const call of calls) {
    if (!call.aimedDepartureTime) continue
    if (!call.serviceJourney || !call.serviceJourney.line) continue

    const routeId = call.serviceJourney.line.id || ''
    const routeCode = call.serviceJourney.line.publicCode || extractRouteCode(routeId)

    // Only process routes for this region
    if (!isRegionRoute(routeCode, region.id)) continue

    // Calculate delay (can be negative for early, 0 for on-time, positive for late)
    const aimedTime = new Date(call.aimedDepartureTime).getTime()
    const expectedTime = call.expectedDepartureTime
      ? new Date(call.expectedDepartureTime).getTime()
      : aimedTime  // If no expected time, assume on-time
    const delayMinutes = (expectedTime - aimedTime) / 60000

    const isRealtime = call.realtime === true
    const isOnTime = delayMinutes <= ON_TIME_THRESHOLD_MINUTES

    const fromStopName = stopPlace.name
    const toStopName = call.destinationDisplay?.frontText || 'Unknown'
    const fromStopId = stopPlace.id
    const toStopId = call.quay?.id || 'unknown'

    // Store raw departure
    departures.push({
      trip_id: call.serviceJourney.id || '',
      route_id: routeId,
      route_code: routeCode,
      station_id: fromStopId,
      station_name: fromStopName,
      destination: toStopName,
      scheduled_time: call.aimedDepartureTime,
      actual_time: call.expectedDepartureTime || null,
      delay_minutes: delayMinutes,
      is_realtime: isRealtime,
      region: region.id
    })

    // Create station stat entry (for all trains)
    stationStats.push({
      date: currentDate,
      from_stop: fromStopId,
      from_stop_name: fromStopName,
      to_stop: toStopId,
      to_stop_name: toStopName,
      avg_delay_minutes: delayMinutes,
      total_delay_minutes: Math.max(0, delayMinutes), // Only count positive delays in total
      delay_count: delayMinutes > 0 ? 1 : 0,
      total_trips: 1,
      on_time_trips: isOnTime ? 1 : 0,
      is_relevant: true,
      region: region.id
    })

    // Create hourly stat entry
    hourlyStats.push({
      date: currentDate,
      hour: currentHour,
      from_stop: fromStopId,
      from_stop_name: fromStopName,
      to_stop: toStopId,
      to_stop_name: toStopName,
      avg_delay_minutes: delayMinutes,
      total_delay_minutes: Math.max(0, delayMinutes),
      delay_count: delayMinutes > 0 ? 1 : 0,
      total_trips: 1,
      on_time_trips: isOnTime ? 1 : 0,
      is_relevant: true,
      region: region.id
    })

    // Aggregate route stats - use line info from Entur API if available
    const lineInfo = lineInfoMap.get(routeCode)
    const routeInfo = getRouteInfo(routeCode, region.id)
    const routeName = lineInfo?.name || routeInfo?.name || routeCode
    const startStation = lineInfo?.startStation || ''
    const endStation = lineInfo?.endStation || ''

    if (!routeStatsMap.has(routeCode)) {
      routeStatsMap.set(routeCode, {
        date: currentDate,
        route_id: routeCode,
        route_name: routeName,
        start_station: startStation,
        end_station: endStation,
        avg_delay_minutes: delayMinutes,
        total_delay_minutes: Math.max(0, delayMinutes),
        delay_count: delayMinutes > 0 ? 1 : 0,
        total_trips: 1,
        on_time_trips: isOnTime ? 1 : 0,
        region: region.id
      })
    } else {
      const existing = routeStatsMap.get(routeCode)!
      existing.total_trips += 1
      existing.total_delay_minutes += Math.max(0, delayMinutes)
      existing.delay_count += delayMinutes > 0 ? 1 : 0
      existing.on_time_trips += isOnTime ? 1 : 0
      existing.avg_delay_minutes = existing.total_delay_minutes / existing.delay_count || 0
    }
  }

  const routeStats = Array.from(routeStatsMap.values())
  return { departures, stationStats, routeStats, hourlyStats }
}

function aggregateStationStats(stats: StationDelay[]): StationDelay[] {
  if (stats.length === 0) return []

  const grouped = new Map<string, StationDelay>()

  for (const stat of stats) {
    const key = `${stat.date}_${stat.from_stop}_${stat.to_stop}`

    if (!grouped.has(key)) {
      grouped.set(key, { ...stat })
    } else {
      const existing = grouped.get(key)!
      existing.total_trips += stat.total_trips
      existing.on_time_trips += stat.on_time_trips
      existing.total_delay_minutes += stat.total_delay_minutes
      existing.delay_count += stat.delay_count
      existing.avg_delay_minutes = existing.delay_count > 0
        ? existing.total_delay_minutes / existing.delay_count
        : 0
    }
  }

  return Array.from(grouped.values())
}

function aggregateRouteStats(stats: RouteStat[]): RouteStat[] {
  if (stats.length === 0) return []

  const grouped = new Map<string, RouteStat>()

  for (const stat of stats) {
    const key = `${stat.date}_${stat.route_id}`

    if (!grouped.has(key)) {
      grouped.set(key, { ...stat })
    } else {
      const existing = grouped.get(key)!
      existing.total_trips += stat.total_trips
      existing.on_time_trips += stat.on_time_trips
      existing.total_delay_minutes += stat.total_delay_minutes
      existing.delay_count += stat.delay_count
      existing.avg_delay_minutes = existing.delay_count > 0
        ? existing.total_delay_minutes / existing.delay_count
        : 0
    }
  }

  return Array.from(grouped.values())
}

function aggregateHourlyStats(stats: HourlyStat[]): HourlyStat[] {
  if (stats.length === 0) return []

  const grouped = new Map<string, HourlyStat>()

  for (const stat of stats) {
    const key = `${stat.date}_${stat.hour}_${stat.from_stop}_${stat.to_stop}`

    if (!grouped.has(key)) {
      grouped.set(key, { ...stat })
    } else {
      const existing = grouped.get(key)!
      existing.total_trips += stat.total_trips
      existing.on_time_trips += stat.on_time_trips
      existing.total_delay_minutes += stat.total_delay_minutes
      existing.delay_count += stat.delay_count
      existing.avg_delay_minutes = existing.delay_count > 0
        ? existing.total_delay_minutes / existing.delay_count
        : 0
    }
  }

  return Array.from(grouped.values())
}

async function upsertDailyStat(supabase: any, stat: StationDelay) {
  const { data: existing } = await supabase
    .from('daily_stats')
    .select('*')
    .eq('date', stat.date)
    .eq('from_stop', stat.from_stop)
    .eq('to_stop', stat.to_stop)
    .single()

  if (existing) {
    const totalTrips = existing.total_trips + stat.total_trips
    const onTimeTrips = existing.on_time_trips + stat.on_time_trips
    const totalDelay = existing.total_delay_minutes + stat.total_delay_minutes
    const delayCount = existing.delay_count + stat.delay_count
    const avgDelay = delayCount > 0 ? totalDelay / delayCount : 0

    const { error } = await supabase
      .from('daily_stats')
      .update({
        avg_delay_minutes: avgDelay,
        total_delay_minutes: totalDelay,
        delay_count: delayCount,
        total_trips: totalTrips,
        on_time_trips: onTimeTrips,
        is_relevant: existing.is_relevant || stat.is_relevant,
        region: stat.region
      })
      .eq('date', stat.date)
      .eq('from_stop', stat.from_stop)
      .eq('to_stop', stat.to_stop)

    if (error) console.error('Error updating daily stat:', error)
  } else {
    const { error } = await supabase
      .from('daily_stats')
      .insert(stat)

    if (error) console.error('Error inserting daily stat:', error)
  }
}

async function upsertRouteStat(supabase: any, stat: RouteStat) {
  const { data: existing } = await supabase
    .from('route_stats')
    .select('*')
    .eq('date', stat.date)
    .eq('route_id', stat.route_id)
    .single()

  if (existing) {
    const totalTrips = existing.total_trips + stat.total_trips
    const onTimeTrips = existing.on_time_trips + stat.on_time_trips
    const totalDelay = existing.total_delay_minutes + stat.total_delay_minutes
    const delayCount = existing.delay_count + stat.delay_count
    const avgDelay = delayCount > 0 ? totalDelay / delayCount : 0

    const { error } = await supabase
      .from('route_stats')
      .update({
        route_name: stat.route_name, // Update route name from Entur API
        start_station: stat.start_station,
        end_station: stat.end_station,
        avg_delay_minutes: avgDelay,
        total_delay_minutes: totalDelay,
        delay_count: delayCount,
        total_trips: totalTrips,
        on_time_trips: onTimeTrips,
        region: stat.region
      })
      .eq('date', stat.date)
      .eq('route_id', stat.route_id)

    if (error) console.error('Error updating route stat:', error)
  } else {
    const { error } = await supabase
      .from('route_stats')
      .insert(stat)

    if (error) console.error('Error inserting route stat:', error)
  }
}

async function upsertHourlyStat(supabase: any, stat: HourlyStat) {
  const { data: existing } = await supabase
    .from('hourly_stats')
    .select('*')
    .eq('date', stat.date)
    .eq('hour', stat.hour)
    .eq('from_stop', stat.from_stop)
    .eq('to_stop', stat.to_stop)
    .single()

  if (existing) {
    const totalTrips = existing.total_trips + stat.total_trips
    const onTimeTrips = existing.on_time_trips + stat.on_time_trips
    const totalDelay = existing.total_delay_minutes + stat.total_delay_minutes
    const delayCount = existing.delay_count + stat.delay_count
    const avgDelay = delayCount > 0 ? totalDelay / delayCount : 0

    const { error } = await supabase
      .from('hourly_stats')
      .update({
        avg_delay_minutes: avgDelay,
        total_delay_minutes: totalDelay,
        delay_count: delayCount,
        total_trips: totalTrips,
        on_time_trips: onTimeTrips,
        is_relevant: existing.is_relevant || stat.is_relevant,
        region: stat.region
      })
      .eq('date', stat.date)
      .eq('hour', stat.hour)
      .eq('from_stop', stat.from_stop)
      .eq('to_stop', stat.to_stop)

    if (error) console.error('Error updating hourly stat:', error)
  } else {
    const { error } = await supabase
      .from('hourly_stats')
      .insert(stat)

    if (error) console.error('Error inserting hourly stat:', error)
  }
}
