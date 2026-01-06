// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// GTFS-RT protobuf parsing
import { FeedMessage } from "https://esm.sh/gtfs-realtime-bindings@0.0.6"

interface HourlyStat {
  hour: number
  from_stop: string
  to_stop: string
  avg_delay_minutes: number
  total_delay_minutes: number
  delay_count: number
  is_relevant: boolean
  created_at?: string
}

Deno.serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    console.log('Fetching GTFS-RT data from Entur API...')

    // Fetch GTFS-RT data from Entur API
    const response = await fetch('https://api.entur.org/realtime/v1/gtfs-rt/trip-updates', {
      headers: {
        'ET-Client-Name': 'norway-train-tracker',
        'ET-Client-Id': 'norway-train-tracker-1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Entur API error: ${response.status} ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()

    // Parse GTFS-RT protobuf
    const feed = FeedMessage.decode(new Uint8Array(buffer))

    // Process the data (similar to Python logic)
    const stats = processGtfsData(feed)

    console.log(`Processed ${stats.length} hourly stats`)

    if (stats.length > 0) {
      // Insert into database
      const { error } = await supabase
        .from('hourly_stats')
        .insert(stats)

      if (error) {
        console.error('Database error:', error)
        throw error
      }

      console.log(`Inserted ${stats.length} records into database`)
    }

    return new Response(JSON.stringify({
      success: true,
      inserted: stats.length,
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

function processGtfsData(feed: any): HourlyStat[] {
  const stats: HourlyStat[] = []
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
      const fromStopName = cleanStopName(fromStop.stopId)
      const toStopName = cleanStopName(toStop.stopId)

      // Check if this pair is relevant
      const isRelevant = relevantPairs.some(([from, to]) =>
        from === fromStopName && to === toStopName
      )

      stats.push({
        hour: currentHour,
        from_stop: fromStopName,
        to_stop: toStopName,
        avg_delay_minutes: delayMinutes,
        total_delay_minutes: delayMinutes,
        delay_count: 1,
        is_relevant: isRelevant
      })
    }
  }

  // Aggregate by station pair (similar to Python groupby)
  const aggregatedStats = aggregateStats(stats)

  return aggregatedStats
}

function isOsloRegionRoute(routeId: string): boolean {
  // Check if route is in Oslo region (simplified check)
  const osloRoutes = [
    'L1', 'L2', 'L12', 'L13', 'L14', 'L21', 'L22',
    'R10', 'R11', 'R12', 'R13', 'R14', 'R20', 'R21', 'R22', 'R23',
    'FLY1', 'FLY2'
  ]
  return osloRoutes.some(route => routeId.includes(route))
}

function cleanStopName(stopId: string): string {
  // Remove platform and other details from stop ID
  // Example: "NSR:StopPlace:337" -> "Oslo S" (would need mapping)
  // For now, return as-is (you'll need to implement proper mapping)
  return stopId.split(':').pop() || stopId
}

function aggregateStats(stats: HourlyStat[]): HourlyStat[] {
  const aggregated = new Map<string, HourlyStat>()

  for (const stat of stats) {
    const key = `${stat.from_stop}-${stat.to_stop}`

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!
      existing.avg_delay_minutes = (existing.avg_delay_minutes * existing.delay_count + stat.avg_delay_minutes) / (existing.delay_count + 1)
      existing.total_delay_minutes += stat.total_delay_minutes
      existing.delay_count += 1
      existing.is_relevant = existing.is_relevant || stat.is_relevant
    } else {
      aggregated.set(key, { ...stat })
    }
  }

  return Array.from(aggregated.values())
}
