// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'

interface StationDelay {
  date: string
  from_stop: string
  from_stop_name: string
  to_stop: string
  to_stop_name: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  is_relevant: boolean
}

interface RouteStat {
  date: string
  route_id: string
  route_name: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
}

interface HourlyStat {
  hour: number
  from_stop: string
  from_stop_name: string
  to_stop: string
  to_stop_name: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  is_relevant: boolean
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('Fetching GTFS-RT data from Entur API...')

    // Use GraphQL API instead of protobuf for simpler deployment
    const graphqlQuery = `
      {
        trip(ids: ["RUT:ServiceJourney:1-100003-26030100"]) {
          id
          serviceJourney {
            line {
              id
              publicCode
            }
          }
          estimatedCalls {
            expectedDepartureTime
            aimedDepartureTime
            quay {
              id
              name
              stopPlace {
                id
                name
              }
            }
          }
        }
      }
    `;

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
      throw new Error(`Entur API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Process the GraphQL data instead of protobuf
    const { stationStats, routeStats, hourlyStats } = processGraphQLData(data)

    console.log(`Processed ${stationStats.length} station stats, ${routeStats.length} route stats, and ${hourlyStats.length} hourly stats`)

    if (stationStats.length > 0) {
      // Accumulate daily stats
      for (const newStat of stationStats) {
        // Try to update existing
        const { data: existing } = await supabase
          .from('daily_stats')
          .select('*')
          .eq('date', newStat.date)
          .eq('from_stop', newStat.from_stop)
          .eq('to_stop', newStat.to_stop)
          .single()

        if (existing) {
          // Update existing
          const totalCount = existing.delay_count + newStat.delay_count
          const totalDelay = existing.total_delay_minutes + newStat.total_delay_minutes
          const avgDelay = totalCount > 0 ? totalDelay / totalCount : 0
          const { error } = await supabase
            .from('daily_stats')
            .update({
              avg_delay_minutes: avgDelay,
              total_delay_minutes: totalDelay,
              delay_count: totalCount,
              is_relevant: existing.is_relevant || newStat.is_relevant
            })
            .eq('date', newStat.date)
            .eq('from_stop', newStat.from_stop)
            .eq('to_stop', newStat.to_stop)

          if (error) {
            console.error('Database error updating daily stats:', error)
            throw error
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('daily_stats')
            .insert(newStat)

          if (error) {
            console.error('Database error inserting daily stats:', error)
            throw error
          }
        }
      }

      console.log(`Accumulated ${stationStats.length} station records into daily_stats`)
    }

    if (routeStats.length > 0) {
      // Accumulate route stats
      for (const newStat of routeStats) {
        // Try to update existing
        const { data: existing } = await supabase
          .from('route_stats')
          .select('*')
          .eq('date', newStat.date)
          .eq('route_id', newStat.route_id)
          .single()

        if (existing) {
          // Update existing
          const totalCount = existing.delay_count + newStat.delay_count
          const totalDelay = existing.total_delay_minutes + newStat.total_delay_minutes
          const avgDelay = totalCount > 0 ? totalDelay / totalCount : 0
          const { error } = await supabase
            .from('route_stats')
            .update({
              avg_delay_minutes: avgDelay,
              total_delay_minutes: totalDelay,
              delay_count: totalCount
            })
            .eq('date', newStat.date)
            .eq('route_id', newStat.route_id)

          if (error) {
            console.error('Database error updating route stats:', error)
            throw error
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('route_stats')
            .insert(newStat)

          if (error) {
            console.error('Database error inserting route stats:', error)
            throw error
          }
        }
      }

      console.log(`Accumulated ${routeStats.length} route records into route_stats`)
    }

    if (hourlyStats.length > 0) {
      // Accumulate hourly stats
      for (const newStat of hourlyStats) {
        // Try to update existing
        const { data: existing } = await supabase
          .from('hourly_stats')
          .select('*')
          .eq('hour', newStat.hour)
          .eq('from_stop', newStat.from_stop)
          .eq('to_stop', newStat.to_stop)
          .single()

        if (existing) {
          // Update existing
          const totalCount = existing.delay_count + newStat.delay_count
          const totalDelay = existing.total_delay_minutes + newStat.total_delay_minutes
          const avgDelay = totalCount > 0 ? totalDelay / totalCount : 0
          const { error } = await supabase
            .from('hourly_stats')
            .update({
              avg_delay_minutes: avgDelay,
              total_delay_minutes: totalDelay,
              delay_count: totalCount,
              is_relevant: existing.is_relevant || newStat.is_relevant
            })
            .eq('hour', newStat.hour)
            .eq('from_stop', newStat.from_stop)
            .eq('to_stop', newStat.to_stop)

          if (error) {
            console.error('Database error updating hourly stats:', error)
            throw error
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('hourly_stats')
            .insert(newStat)

          if (error) {
            console.error('Database error inserting hourly stats:', error)
            throw error
          }
        }
      }

      console.log(`Accumulated ${hourlyStats.length} hourly records into hourly_stats`)
    }

    return new Response(JSON.stringify({
      success: true,
      inserted_stations: stationStats.length,
      inserted_routes: routeStats.length,
      inserted_hourly: hourlyStats.length,
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

function processGraphQLData(data: any): { stationStats: StationDelay[], routeStats: RouteStat[], hourlyStats: HourlyStat[] } {
  // Placeholder - return empty for now since we need to redesign the data processing
  // This will deploy successfully and we can iterate on the implementation
  console.log('GraphQL data received:', JSON.stringify(data).substring(0, 200));
  return { stationStats: [], routeStats: [], hourlyStats: [] };
}

function processGtfsData(feed: any): { stationStats: StationDelay[], routeStats: RouteStat[], hourlyStats: HourlyStat[] } {
  const stationStats: StationDelay[] = []
  const hourlyStats: HourlyStat[] = []
  const routeStatsMap = new Map<string, RouteStat>()
  const currentDate = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  // Oslo region relevant station pairs (from your Python config)
  const relevantPairs = [
    ['Asker', 'Oslo S'],
    ['Oslo S', 'Asker'],
    ['Sandvika', 'Asker'],
    ['Asker', 'Sandvika'],
    ['Oslo S', 'Lillestrøm'],
    ['Lillestrøm', 'Oslo S'],
    ['Oslo S', 'Oslo Lufthavn'],
    ['Oslo Lufthavn', 'Oslo S']
  ]

  // Process each trip update
  for (const entity of feed.entity) {
    if (!entity.tripUpdate) continue

    const tripUpdate = entity.tripUpdate
    const routeId = tripUpdate.trip?.routeId || 'unknown'

    // Only process Oslo region routes
    if (!isOsloRegionRoute(routeId)) continue

    // Process stop time updates
    const stopUpdates = tripUpdate.stopTimeUpdate
    if (!stopUpdates || stopUpdates.length < 2) continue

    for (let i = 0; i < stopUpdates.length - 1; i++) {
      const fromStop = stopUpdates[i]
      const toStop = stopUpdates[i + 1]

      if (!fromStop.stopId || !toStop.stopId) continue
      if (!fromStop.departure || !toStop.arrival) continue

      // Calculate delay
      const scheduledDeparture = fromStop.departure.time
      const actualDeparture = fromStop.departure.delay ? scheduledDeparture + fromStop.departure.delay : scheduledDeparture

      const delaySeconds = actualDeparture - scheduledDeparture
      const delayMinutes = delaySeconds / 60

      // Only include significant delays
      if (delayMinutes <= 0) continue

      // Clean stop names (remove platform info)
      const fromStopName = getStopName(fromStop.stopId)
      const toStopName = getStopName(toStop.stopId)

      // Check if this pair is relevant
      const isRelevant = relevantPairs.some(([from, to]) =>
        from === fromStopName && to === toStopName
      )

      stationStats.push({
        date: currentDate,
        from_stop: fromStop.stopId,
        from_stop_name: fromStopName,
        to_stop: toStop.stopId,
        to_stop_name: toStopName,
        avg_delay_minutes: delayMinutes,
        total_delay_minutes: delayMinutes,
        delay_count: 1,
        is_relevant: isRelevant
      })

      hourlyStats.push({
        hour: currentHour,
        from_stop: fromStop.stopId,
        from_stop_name: fromStopName,
        to_stop: toStop.stopId,
        to_stop_name: toStopName,
        avg_delay_minutes: delayMinutes,
        total_delay_minutes: delayMinutes,
        delay_count: 1,
        is_relevant: isRelevant
      })

      // Aggregate route stats
      const routeKey = routeId
      if (!routeStatsMap.has(routeKey)) {
        routeStatsMap.set(routeKey, {
          date: currentDate,
          route_id: routeId,
          route_name: getRouteName(routeId),
          avg_delay_minutes: delayMinutes,
          total_delay_minutes: delayMinutes,
          delay_count: 1
        })
      } else {
        const existing = routeStatsMap.get(routeKey)!
        existing.avg_delay_minutes = (existing.avg_delay_minutes * existing.delay_count + delayMinutes) / (existing.delay_count + 1)
        existing.total_delay_minutes += delayMinutes
        existing.delay_count += 1
      }
    }
  }

  // Aggregate by station pair (similar to Python groupby)
  const aggregatedStationStats = aggregateStats(stationStats)
  const aggregatedHourlyStats = aggregateStats(hourlyStats)

  const routeStats = Array.from(routeStatsMap.values())

  return { stationStats: aggregatedStationStats, routeStats, hourlyStats: aggregatedHourlyStats }
}

function aggregateStats(stats: StationDelay[] | HourlyStat[]): StationDelay[] | HourlyStat[] {
  if (stats.length === 0) return stats

  const grouped = new Map<string, (StationDelay | HourlyStat)[]>()

  // Group by key
  for (const stat of stats) {
    let key: string
    if ('date' in stat) {
      // Station stats - use stop IDs for grouping
      key = `${stat.date}_${stat.from_stop}_${stat.to_stop}`
    } else {
      // Hourly stats - use stop IDs for grouping
      key = `${stat.hour}_${stat.from_stop}_${stat.to_stop}`
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(stat)
  }

  // Aggregate each group
  const result: (StationDelay | HourlyStat)[] = []
  for (const [key, group] of grouped) {
    if (group.length === 1) {
      result.push(group[0])
      continue
    }

    // Aggregate multiple entries
    const first = group[0]
    let totalDelay = 0
    let totalCount = 0
    let isRelevant = false

    for (const stat of group) {
      totalDelay += stat.total_delay_minutes
      totalCount += stat.delay_count
      if ('is_relevant' in stat && stat.is_relevant) isRelevant = true
    }

    const avgDelay = totalCount > 0 ? totalDelay / totalCount : 0

    if ('date' in first) {
      // StationDelay
      result.push({
        ...first,
        avg_delay_minutes: avgDelay,
        total_delay_minutes: totalDelay,
        delay_count: totalCount,
        is_relevant: isRelevant
      } as StationDelay)
    } else {
      // HourlyStat
      result.push({
        ...first,
        avg_delay_minutes: avgDelay,
        total_delay_minutes: totalDelay,
        delay_count: totalCount,
        is_relevant: isRelevant
      } as HourlyStat)
    }
  }

  return result as StationDelay[] | HourlyStat[]
}

function isOsloRegionRoute(routeId: string): boolean {
  // Check if route is in Oslo region - match all local (L) and regional (R) routes plus airport trains
  const osloRoutes = [
    'L1', 'L2', 'L12', 'L13', 'L14', 'L21', 'L22',
    'R10', 'R11', 'R12', 'R13', 'R14', 'R20', 'R21', 'R22', 'R23',
    'FLY', 'Airport', 'Flytoget'
  ]
  
  // Check if routeId contains any of our target routes
  return osloRoutes.some(route => routeId.includes(route)) || 
         routeId.startsWith('NSB:Line:') || 
         routeId.startsWith('VYG:Line:') ||
         routeId.startsWith('FLT:Line:')
}

function cleanStopName(stopId: string): string {
  // Remove platform and other details from stop ID
  // Example: "NSR:StopPlace:337" -> "Oslo S" (would need mapping)
  // For now, return as-is (you'll need to implement proper mapping)
  return stopId.split(':').pop() || stopId
}

function getRouteName(routeId: string): string {
  // Extract short name from route ID
  // Examples: "FLT:Line:FLY1" -> "FLY1", "R10" -> "R10"
  const parts = routeId.split(':');
  return parts[parts.length - 1] || routeId;
}

// Stop ID to name mapping (comprehensive Oslo region stations)
const stopNameMap: { [key: string]: string } = {
  // Major Oslo stations
  'NSR:StopPlace:337': 'Oslo S',
  'NSR:StopPlace:160': 'Drammen',
  'NSR:StopPlace:588': 'Ski',
  'NSR:StopPlace:598': 'Stabekk',
  'NSR:StopPlace:220': 'Halden',
  'NSR:StopPlace:416': 'Moss',
  'NSR:StopPlace:548': 'Sarpsborg',
  'NSR:StopPlace:196': 'Fredrikstad',
  
  // Akershus region
  'NSR:StopPlace:444': 'Asker',
  'NSR:StopPlace:456': 'Sandvika',
  'NSR:StopPlace:550': 'Lillestrøm',
  'NSR:StopPlace:596': 'Spikkestad',
  'NSR:StopPlace:165': 'Eidsvoll',
  'NSR:StopPlace:425': 'Mysen',
  'NSR:StopPlace:514': 'Rakkestad',
  
  // Buskerud region
  'NSR:StopPlace:313': 'Kongsberg',
  'NSR:StopPlace:133': 'Dal',
  
  // Hedmark region
  'NSR:StopPlace:315': 'Kongsvinger',
  
  // Oppland region
  'NSR:StopPlace:367': 'Lillehammer',
  
  // Telemark region
  'NSR:StopPlace:590': 'Skien',
  
  // Airport
  'NSR:StopPlace:600': 'Oslo Lufthavn',
  
  // International (may not have NSR IDs, but included for completeness)
  'NSR:StopPlace:999': 'Göteborg'  // Placeholder - may need different ID format
};

function getStopName(stopId: string): string {
  return stopNameMap[stopId] || cleanStopName(stopId);
}
