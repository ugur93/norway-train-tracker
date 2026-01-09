/**
 * Region Configuration for Norway Train Tracker
 * Defines stations and routes for each supported region.
 * Start with Oslo region, easily extensible to other regions.
 */

export interface Station {
  id: string;          // NSR StopPlace ID
  name: string;
  latitude: number;
  longitude: number;
}

export interface Route {
  code: string;        // Route code (L1, R10, FLY1, etc.)
  name: string;
  type: 'local' | 'regional' | 'airport_express';
  stations: string[];  // Station IDs in order
  description: string;
}

export interface RegionConfig {
  id: string;
  name: string;
  stations: Station[];
  routes: Route[];
  routeCodes: string[];  // Quick lookup for route filtering
}

// Oslo Region Configuration
export const OSLO_REGION: RegionConfig = {
  id: 'oslo',
  name: 'Oslo Region',
  stations: [
    // Central Oslo
    { id: 'NSR:StopPlace:337', name: 'Oslo S', latitude: 59.9111, longitude: 10.7550 },
    { id: 'NSR:StopPlace:58366', name: 'Skøyen', latitude: 59.9200, longitude: 10.6833 },

    // West corridor (Oslo - Drammen)
    { id: 'NSR:StopPlace:418', name: 'Lysaker', latitude: 59.9128, longitude: 10.6350 },
    { id: 'NSR:StopPlace:456', name: 'Sandvika', latitude: 59.8930, longitude: 10.5267 },
    { id: 'NSR:StopPlace:444', name: 'Asker', latitude: 59.8333, longitude: 10.4378 },
    { id: 'NSR:StopPlace:160', name: 'Drammen', latitude: 59.7440, longitude: 10.2045 },
    { id: 'NSR:StopPlace:596', name: 'Spikkestad', latitude: 59.9467, longitude: 10.4100 },
    { id: 'NSR:StopPlace:313', name: 'Kongsberg', latitude: 59.6686, longitude: 9.6502 },

    // North corridor (Oslo - Gardermoen - Eidsvoll)
    { id: 'NSR:StopPlace:550', name: 'Lillestrøm', latitude: 59.9550, longitude: 11.0492 },
    { id: 'NSR:StopPlace:598', name: 'Oslo Lufthavn', latitude: 60.1939, longitude: 11.1004 },
    { id: 'NSR:StopPlace:165', name: 'Eidsvoll', latitude: 60.3286, longitude: 11.1581 },

    // East corridor (Oslo - Kongsvinger)
    { id: 'NSR:StopPlace:315', name: 'Kongsvinger', latitude: 60.1911, longitude: 12.0039 },

    // South corridor (Oslo - Ski - Østfold)
    { id: 'NSR:StopPlace:588', name: 'Ski', latitude: 59.7194, longitude: 10.8389 },
    { id: 'NSR:StopPlace:416', name: 'Moss', latitude: 59.4344, longitude: 10.6572 },
    { id: 'NSR:StopPlace:220', name: 'Halden', latitude: 59.1222, longitude: 11.3875 },
    { id: 'NSR:StopPlace:425', name: 'Mysen', latitude: 59.5536, longitude: 11.3258 },
    { id: 'NSR:StopPlace:514', name: 'Rakkestad', latitude: 59.4286, longitude: 11.3450 },
    { id: 'NSR:StopPlace:548', name: 'Sarpsborg', latitude: 59.2833, longitude: 11.1094 },
    { id: 'NSR:StopPlace:196', name: 'Fredrikstad', latitude: 59.2181, longitude: 10.9298 },

    // North (Dovre line)
    { id: 'NSR:StopPlace:367', name: 'Lillehammer', latitude: 61.1153, longitude: 10.4662 },

    // South-west (Vestfold)
    { id: 'NSR:StopPlace:590', name: 'Skien', latitude: 59.2096, longitude: 9.6089 },
  ],
  routes: [
    // Local trains (L-series)
    {
      code: 'L1',
      name: 'Spikkestad - Oslo S - Lillestrøm',
      type: 'local',
      stations: ['NSR:StopPlace:596', 'NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:550', 'NSR:StopPlace:165'],
      description: 'Oslo - Akershus (north-east)'
    },
    {
      code: 'L2',
      name: 'Ski - Oslo S - Stabekk',
      type: 'local',
      stations: ['NSR:StopPlace:588', 'NSR:StopPlace:337', 'NSR:StopPlace:58366'],
      description: 'Oslo - Østfold (south-east) - Bærum (west)'
    },
    {
      code: 'L12',
      name: 'Kongsberg - Oslo S - Eidsvoll',
      type: 'local',
      stations: ['NSR:StopPlace:313', 'NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
      description: 'Buskerud - Oslo - Akershus'
    },
    {
      code: 'L13',
      name: 'Drammen - Oslo S - Dal',
      type: 'local',
      stations: ['NSR:StopPlace:160', 'NSR:StopPlace:337'],
      description: 'Buskerud - Oslo - Akershus'
    },
    {
      code: 'L14',
      name: 'Asker - Oslo S - Kongsvinger',
      type: 'local',
      stations: ['NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:315'],
      description: 'Akershus - Oslo - Hedmark'
    },
    {
      code: 'L21',
      name: 'Stabekk - Oslo S - Moss',
      type: 'local',
      stations: ['NSR:StopPlace:58366', 'NSR:StopPlace:337', 'NSR:StopPlace:416'],
      description: 'Bærum - Oslo - Østfold'
    },
    {
      code: 'L22',
      name: 'Mysen - Oslo S - Stabekk',
      type: 'local',
      stations: ['NSR:StopPlace:425', 'NSR:StopPlace:337', 'NSR:StopPlace:58366'],
      description: 'Østfold - Oslo - Bærum'
    },

    // Regional trains (R-series)
    {
      code: 'R10',
      name: 'Drammen - Oslo S - Lillehammer',
      type: 'regional',
      stations: ['NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:367'],
      description: 'Buskerud - Oslo - Oppland'
    },
    {
      code: 'R11',
      name: 'Skien - Oslo S - Eidsvoll',
      type: 'regional',
      stations: ['NSR:StopPlace:590', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
      description: 'Telemark - Oslo - Akershus'
    },
    {
      code: 'R12',
      name: 'Kongsberg - Oslo S - Eidsvoll',
      type: 'regional',
      stations: ['NSR:StopPlace:313', 'NSR:StopPlace:337', 'NSR:StopPlace:165'],
      description: 'Buskerud - Oslo - Akershus'
    },
    {
      code: 'R13',
      name: 'Drammen - Oslo S - Dal',
      type: 'regional',
      stations: ['NSR:StopPlace:160', 'NSR:StopPlace:337'],
      description: 'Buskerud - Oslo - Akershus'
    },
    {
      code: 'R14',
      name: 'Asker - Oslo S - Kongsvinger',
      type: 'regional',
      stations: ['NSR:StopPlace:444', 'NSR:StopPlace:337', 'NSR:StopPlace:315'],
      description: 'Akershus - Oslo - Hedmark'
    },
    {
      code: 'R20',
      name: 'Oslo S - Ski - Halden',
      type: 'regional',
      stations: ['NSR:StopPlace:337', 'NSR:StopPlace:588', 'NSR:StopPlace:220'],
      description: 'Oslo - Østfold'
    },
    {
      code: 'R21',
      name: 'Oslo S - Moss',
      type: 'regional',
      stations: ['NSR:StopPlace:337', 'NSR:StopPlace:416'],
      description: 'Oslo - Østfold'
    },
    {
      code: 'R22',
      name: 'Oslo S - Mysen - Rakkestad',
      type: 'regional',
      stations: ['NSR:StopPlace:337', 'NSR:StopPlace:425', 'NSR:StopPlace:514'],
      description: 'Oslo - Østfold'
    },
    {
      code: 'R23',
      name: 'Oslo S - Sarpsborg - Fredrikstad',
      type: 'regional',
      stations: ['NSR:StopPlace:337', 'NSR:StopPlace:548', 'NSR:StopPlace:196'],
      description: 'Oslo - Østfold'
    },

    // Airport Express (Flytoget)
    {
      code: 'FLY1',
      name: 'Oslo S - Oslo Lufthavn',
      type: 'airport_express',
      stations: ['NSR:StopPlace:337', 'NSR:StopPlace:598'],
      description: 'Oslo - Akershus (airport)'
    },
    {
      code: 'FLY2',
      name: 'Drammen - Oslo S - Oslo Lufthavn',
      type: 'airport_express',
      stations: ['NSR:StopPlace:160', 'NSR:StopPlace:337', 'NSR:StopPlace:598'],
      description: 'Buskerud - Oslo - Akershus (airport)'
    }
  ],
  routeCodes: [
    'L1', 'L2', 'L12', 'L13', 'L14', 'L21', 'L22',
    'R10', 'R11', 'R12', 'R13', 'R14', 'R20', 'R21', 'R22', 'R23',
    'FLY1', 'FLY2', 'FLY', 'Flytoget'
  ]
};

// Map of all regions - easily extensible
export const REGIONS: Record<string, RegionConfig> = {
  oslo: OSLO_REGION,
  // Future regions can be added here:
  // bergen: BERGEN_REGION,
  // trondheim: TRONDHEIM_REGION,
};

/**
 * Get station IDs for a specific region
 */
export function getStationIds(regionId: string): string[] {
  const region = REGIONS[regionId];
  if (!region) return [];
  return region.stations.map(s => s.id);
}

/**
 * Get station name by ID
 */
export function getStationName(stationId: string, regionId: string = 'oslo'): string {
  const region = REGIONS[regionId];
  if (!region) return stationId;
  const station = region.stations.find(s => s.id === stationId);
  return station?.name || stationId.split(':').pop() || stationId;
}

/**
 * Check if a route code belongs to a region
 */
export function isRegionRoute(routeCode: string, regionId: string = 'oslo'): boolean {
  const region = REGIONS[regionId];
  if (!region) return false;

  // Check exact match or prefix match
  return region.routeCodes.some(code =>
    routeCode === code ||
    routeCode.includes(code) ||
    routeCode.startsWith('NSB:Line:') ||
    routeCode.startsWith('VYG:Line:') ||
    routeCode.startsWith('FLT:Line:')
  );
}

/**
 * Extract route code from full route ID
 */
export function extractRouteCode(routeId: string): string {
  // Handle formats like "FLT:Line:FLY1" -> "FLY1"
  const parts = routeId.split(':');
  return parts[parts.length - 1] || routeId;
}

/**
 * Get route info by code
 */
export function getRouteInfo(routeCode: string, regionId: string = 'oslo'): Route | undefined {
  const region = REGIONS[regionId];
  if (!region) return undefined;
  return region.routes.find(r => r.code === routeCode);
}

/**
 * Get route type display name in Norwegian
 */
export function getRouteTypeDisplay(type: string): string {
  switch (type) {
    case 'local': return 'Lokaltog';
    case 'regional': return 'Regiontog';
    case 'airport_express': return 'Flytoget';
    default: return type;
  }
}

// Norwegian punctuality standard: on time if delay <= 3 minutes
export const ON_TIME_THRESHOLD_MINUTES = 3;
