#!/usr/bin/env python3
"""
Oslo Region Train Routes and Stations Configuration
This file contains all train routes and stations in the Oslo region.
Used by the train delay dashboard to process and display delay information.
"""

from typing import Dict, List, Any

# Oslo Region Train Routes Configuration
OSLO_REGION_ROUTES = {
    # Local trains (L-series)
    "L1": {
        "name": "Spikkestad - Oslo S - Lillestrøm",
        "type": "local",
        "stations": ["Spikkestad", "Asker", "Oslo S", "Lillestrøm", "Eidsvoll"],
        "description": "Oslo - Akershus (north-east)"
    },
    "L2": {
        "name": "Ski - Oslo S - Stabekk",
        "type": "local",
        "stations": ["Ski", "Oslo S", "Stabekk"],
        "description": "Oslo - Østfold (south-east) - Bærum (west)"
    },
    "L12": {
        "name": "Kongsberg - Oslo S - Eidsvoll",
        "type": "local",
        "stations": ["Kongsberg", "Drammen", "Oslo S", "Eidsvoll"],
        "description": "Buskerud - Oslo - Akershus"
    },
    "L13": {
        "name": "Drammen - Oslo S - Dal",
        "type": "local",
        "stations": ["Drammen", "Oslo S", "Dal"],
        "description": "Buskerud - Oslo - Akershus"
    },
    "L14": {
        "name": "Asker - Oslo S - Kongsvinger",
        "type": "local",
        "stations": ["Asker", "Oslo S", "Kongsvinger"],
        "description": "Akershus - Oslo - Hedmark"
    },
    "L21": {
        "name": "Stabekk - Oslo S - Moss",
        "type": "local",
        "stations": ["Stabekk", "Oslo S", "Moss"],
        "description": "Bærum - Oslo - Østfold"
    },
    "L22": {
        "name": "Mysen - Oslo S - Stabekk",
        "type": "local",
        "stations": ["Mysen", "Oslo S", "Stabekk"],
        "description": "Østfold - Oslo - Bærum"
    },

    # Regional trains (R-series)
    "R10": {
        "name": "Drammen - Oslo S - Lillehammer",
        "type": "regional",
        "stations": ["Drammen", "Oslo S", "Lillehammer"],
        "description": "Buskerud - Oslo - Oppland"
    },
    "R11": {
        "name": "Skien - Oslo S - Eidsvoll",
        "type": "regional",
        "stations": ["Skien", "Oslo S", "Eidsvoll"],
        "description": "Telemark - Oslo - Akershus"
    },
    "R12": {
        "name": "Kongsberg - Oslo S - Eidsvoll",
        "type": "regional",
        "stations": ["Kongsberg", "Oslo S", "Eidsvoll"],
        "description": "Buskerud - Oslo - Akershus"
    },
    "R13": {
        "name": "Drammen - Oslo S - Dal",
        "type": "regional",
        "stations": ["Drammen", "Oslo S", "Dal"],
        "description": "Buskerud - Oslo - Akershus"
    },
    "R14": {
        "name": "Asker - Oslo S - Kongsvinger",
        "type": "regional",
        "stations": ["Asker", "Oslo S", "Kongsvinger"],
        "description": "Akershus - Oslo - Hedmark"
    },
    "R20": {
        "name": "Oslo S - Ski - Halden",
        "type": "regional",
        "stations": ["Oslo S", "Ski", "Halden"],
        "description": "Oslo - Østfold"
    },
    "R21": {
        "name": "Oslo S - Moss - Göteborg",
        "type": "regional",
        "stations": ["Oslo S", "Moss", "Göteborg"],
        "description": "Oslo - Østfold - Sweden"
    },
    "R22": {
        "name": "Oslo S - Mysen - Rakkestad",
        "type": "regional",
        "stations": ["Oslo S", "Mysen", "Rakkestad"],
        "description": "Oslo - Østfold"
    },
    "R23": {
        "name": "Oslo S - Sarpsborg - Fredrikstad",
        "type": "regional",
        "stations": ["Oslo S", "Sarpsborg", "Fredrikstad"],
        "description": "Oslo - Østfold"
    },

    # Airport Express trains
    "FLY1": {
        "name": "Oslo S - Oslo Lufthavn",
        "type": "airport_express",
        "stations": ["Oslo S", "Oslo Lufthavn"],
        "description": "Oslo - Akershus (airport)"
    },
    "FLY2": {
        "name": "Drammen - Oslo S - Oslo Lufthavn",
        "type": "airport_express",
        "stations": ["Drammen", "Oslo S", "Oslo Lufthavn"],
        "description": "Buskerud - Oslo - Akershus (airport)"
    }
}

# Station coordinates and information (approximate coordinates for Oslo region stations)
OSLO_REGION_STATIONS = {
    "Spikkestad": {"name": "Spikkestad", "latitude": 59.9467, "longitude": 10.4100},
    "Asker": {"name": "Asker", "latitude": 59.8333, "longitude": 10.4378},
    "Oslo S": {"name": "Oslo Central Station", "latitude": 59.9111, "longitude": 10.7550},
    "Lillestrøm": {"name": "Lillestrøm", "latitude": 59.9550, "longitude": 11.0492},
    "Eidsvoll": {"name": "Eidsvoll", "latitude": 60.3286, "longitude": 11.1581},
    "Ski": {"name": "Ski", "latitude": 59.7194, "longitude": 10.8389},
    "Stabekk": {"name": "Stabekk", "latitude": 59.9072, "longitude": 10.5878},
    "Kongsberg": {"name": "Kongsberg", "latitude": 59.6686, "longitude": 9.6502},
    "Drammen": {"name": "Drammen", "latitude": 59.7440, "longitude": 10.2045},
    "Dal": {"name": "Dal", "latitude": 60.4167, "longitude": 11.1167},
    "Kongsvinger": {"name": "Kongsvinger", "latitude": 60.1911, "longitude": 12.0039},
    "Moss": {"name": "Moss", "latitude": 59.4344, "longitude": 10.6572},
    "Mysen": {"name": "Mysen", "latitude": 59.5536, "longitude": 11.3258},
    "Lillehammer": {"name": "Lillehammer", "latitude": 61.1153, "longitude": 10.4662},
    "Skien": {"name": "Skien", "latitude": 59.2096, "longitude": 9.6089},
    "Halden": {"name": "Halden", "latitude": 59.1222, "longitude": 11.3875},
    "Göteborg": {"name": "Göteborg", "latitude": 57.7089, "longitude": 11.9746},
    "Rakkestad": {"name": "Rakkestad", "latitude": 59.4286, "longitude": 11.3450},
    "Sarpsborg": {"name": "Sarpsborg", "latitude": 59.2833, "longitude": 11.1094},
    "Fredrikstad": {"name": "Fredrikstad", "latitude": 59.2181, "longitude": 10.9298},
    "Oslo Lufthavn": {"name": "Oslo Lufthavn", "latitude": 60.1939, "longitude": 11.1004}
}

def get_all_route_codes() -> List[str]:
    """Get all route codes in the Oslo region"""
    return list(OSLO_REGION_ROUTES.keys())

def get_all_station_names() -> List[str]:
    """Get all station names in the Oslo region"""
    return list(OSLO_REGION_STATIONS.keys())

def get_routes_by_type(route_type: str) -> Dict[str, Dict[str, Any]]:
    """Get routes filtered by type (local, regional, airport_express)"""
    return {code: route for code, route in OSLO_REGION_ROUTES.items()
            if route["type"] == route_type}

def get_station_pairs_for_route(route_code: str) -> List[tuple]:
    """Get all consecutive station pairs for a given route"""
    if route_code not in OSLO_REGION_ROUTES:
        return []

    stations = OSLO_REGION_ROUTES[route_code]["stations"]
    pairs = []
    for i in range(len(stations) - 1):
        pairs.append((stations[i], stations[i + 1]))
    return pairs

def get_all_station_pairs() -> List[tuple]:
    """Get all possible station pairs across all routes"""
    all_pairs = set()
    for route_code in OSLO_REGION_ROUTES:
        pairs = get_station_pairs_for_route(route_code)
        all_pairs.update(pairs)
    return list(all_pairs)

def is_valid_route(route_code: str) -> bool:
    """Check if a route code is valid"""
    return route_code in OSLO_REGION_ROUTES

def is_valid_station(station_name: str) -> bool:
    """Check if a station name is valid"""
    return station_name in OSLO_REGION_STATIONS

def add_custom_route(route_code: str, route_info: Dict[str, Any]) -> None:
    """Add a custom route to the configuration (for future expansion)"""
    OSLO_REGION_ROUTES[route_code] = route_info

def add_custom_station(station_name: str, station_info: Dict[str, Any]) -> None:
    """Add a custom station to the configuration (for future expansion)"""
    OSLO_REGION_STATIONS[station_name] = station_info

if __name__ == "__main__":
    # Print summary information
    print(f"Total routes: {len(OSLO_REGION_ROUTES)}")
    print(f"Total stations: {len(OSLO_REGION_STATIONS)}")

    print("\nRoute types:")
    for route_type in ["local", "regional", "airport_express"]:
        routes = get_routes_by_type(route_type)
        print(f"  {route_type.title()}: {len(routes)} routes")

    print("\nSample routes:")
    for code, route in list(OSLO_REGION_ROUTES.items())[:3]:
        print(f"  {code}: {route['name']} ({len(route['stations'])} stations)")