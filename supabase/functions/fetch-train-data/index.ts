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

    // Fetch data from all stations on Oslo S <-> Drammen and Oslo S <-> Gardemoen routes
    const stations = [
      // Oslo S
      'NSR:StopPlace:337',  // Oslo S
      
      // Oslo S <-> Drammen route
      'NSR:StopPlace:58366', // Skøyen
      'NSR:StopPlace:418',   // Lysaker
      'NSR:StopPlace:456',   // Sandvika
      'NSR:StopPlace:444',   // Asker
      'NSR:StopPlace:160',   // Drammen
      
      // Oslo S <-> Gardemoen route (via Lillestrøm)
      'NSR:StopPlace:598',   // Oslo Lufthavn Stasjon
      'NSR:StopPlace:550',   // Lillestrøm
      'NSR:StopPlace:58367', // Dal
      'NSR:StopPlace:600',   // Oslo Lufthavn (Gardermoen)
    ];

    const allStationStats: StationDelay[] = [];
    const allRouteStats: RouteStat[] = [];
    const allHourlyStats: HourlyStat[] = [];

    // Fetch data from each station
    for (const stationId of stations) {
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
      `;

      try {
        const response = await fetch('https://api.entur.io/journey-planner/v3/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ET-Client-Name': 'norway-train-tracker',
            'ET-Client-Id': 'norway-train-tracker-1.0'
          },
          body: JSON.stringify({ query: graphqlQuery })
        });

        if (!response.ok) {
          console.error(`Entur API error for ${stationId}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        
        // Check if the response contains valid data before processing
        if (!data || !data.data || !data.data.stopPlace) {
          console.warn(`No valid stopPlace data for ${stationId}, skipping...`);
          continue;
        }
        
        const { stationStats, routeStats, hourlyStats } = processGraphQLData(data);
        
        allStationStats.push(...stationStats);
        allRouteStats.push(...routeStats);
        allHourlyStats.push(...hourlyStats);
      } catch (error) {
        console.error(`Error fetching data for ${stationId}:`, error);
      }
    }

    console.log(`Total processed: ${allStationStats.length} station stats, ${allRouteStats.length} route stats, ${allHourlyStats.length} hourly stats`)

    // Use aggregated data
    const stationStats = allStationStats;
    const routeStats = allRouteStats;
    const hourlyStats = allHourlyStats;

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
  const stationStats: StationDelay[] = []
  const hourlyStats: HourlyStat[] = []
  const routeStatsMap = new Map<string, RouteStat>()
  const currentDate = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()

  console.log('Processing GraphQL data...');

  // Check if we have valid data
  if (!data || !data.data || !data.data.stopPlace) {
    console.error('Invalid GraphQL response:', JSON.stringify(data).substring(0, 500));
    return { stationStats: [], routeStats: [], hourlyStats: [] };
  }

  const stopPlace = data.data.stopPlace;
  const calls = stopPlace.estimatedCalls || [];

  console.log(`Processing ${calls.length} estimated calls from ${stopPlace.name}`);

  // Oslo region relevant station pairs
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

  // Process each estimated call
  for (const call of calls) {
    if (!call.realtime || !call.aimedDepartureTime || !call.expectedDepartureTime) continue;
    if (!call.serviceJourney || !call.serviceJourney.line) continue;

    const routeId = call.serviceJourney.line.publicCode || call.serviceJourney.line.id;
    
    // Only process Oslo region routes (trains)
    if (!isOsloRegionRoute(routeId)) continue;

    // Calculate delay
    const aimedTime = new Date(call.aimedDepartureTime).getTime();
    const expectedTime = new Date(call.expectedDepartureTime).getTime();
    const delaySeconds = (expectedTime - aimedTime) / 1000;
    const delayMinutes = delaySeconds / 60;

    // Only include significant delays (> 0 minutes)
    if (delayMinutes <= 0) continue;

    const fromStopName = stopPlace.name;
    const toStopName = call.destinationDisplay?.frontText || 'Unknown';
    const fromStopId = stopPlace.id;
    const toStopId = call.quay?.id || 'unknown';

    // Check if this pair is relevant
    const isRelevant = relevantPairs.some(([from, to]) =>
      from === fromStopName && to === toStopName
    );

    stationStats.push({
      date: currentDate,
      from_stop: fromStopId,
      from_stop_name: fromStopName,
      to_stop: toStopId,
      to_stop_name: toStopName,
      avg_delay_minutes: delayMinutes,
      total_delay_minutes: delayMinutes,
      delay_count: 1,
      is_relevant: isRelevant
    });

    hourlyStats.push({
      hour: currentHour,
      from_stop: fromStopId,
      from_stop_name: fromStopName,
      to_stop: toStopId,
      to_stop_name: toStopName,
      avg_delay_minutes: delayMinutes,
      total_delay_minutes: delayMinutes,
      delay_count: 1,
      is_relevant: isRelevant
    });

    // Aggregate route stats
    if (!routeStatsMap.has(routeId)) {
      routeStatsMap.set(routeId, {
        date: currentDate,
        route_id: routeId,
        route_name: getRouteName(routeId),
        avg_delay_minutes: delayMinutes,
        total_delay_minutes: delayMinutes,
        delay_count: 1
      });
    } else {
      const existing = routeStatsMap.get(routeId)!;
      existing.avg_delay_minutes = (existing.avg_delay_minutes * existing.delay_count + delayMinutes) / (existing.delay_count + 1);
      existing.total_delay_minutes += delayMinutes;
      existing.delay_count += 1;
    }
  }

  // Aggregate by station pair
  const aggregatedStationStats = aggregateStats(stationStats) as StationDelay[];
  const aggregatedHourlyStats = aggregateStats(hourlyStats) as HourlyStat[];
  const routeStats = Array.from(routeStatsMap.values());

  console.log(`Processed: ${aggregatedStationStats.length} station pairs, ${routeStats.length} routes, ${aggregatedHourlyStats.length} hourly stats`);

  return { stationStats: aggregatedStationStats, routeStats, hourlyStats: aggregatedHourlyStats };
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
  
  // Oslo S <-> Drammen route
  'NSR:StopPlace:58366': 'Skøyen',
  'NSR:StopPlace:418': 'Lysaker',
  'NSR:StopPlace:456': 'Sandvika',
  'NSR:StopPlace:444': 'Asker',
  'NSR:StopPlace:160': 'Drammen',
  
  // Oslo S <-> Gardemoen route
  'NSR:StopPlace:598': 'Oslo Lufthavn Stasjon',
  'NSR:StopPlace:550': 'Lillestrøm',
  'NSR:StopPlace:58367': 'Dal',
  'NSR:StopPlace:600': 'Oslo Lufthavn',
  
  // Other major stations
  'NSR:StopPlace:588': 'Ski',
  'NSR:StopPlace:220': 'Halden',
  'NSR:StopPlace:416': 'Moss',
  'NSR:StopPlace:548': 'Sarpsborg',
  'NSR:StopPlace:196': 'Fredrikstad',
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
  
  // International (may not have NSR IDs, but included for completeness)
  'NSR:StopPlace:999': 'Göteborg'  // Placeholder - may need different ID format
};

function getStopName(stopId: string): string {
  return stopNameMap[stopId] || cleanStopName(stopId);
}
