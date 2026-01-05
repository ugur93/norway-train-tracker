#!/usr/bin/env python3
"""
Train Delay Data Fetcher and JSON Generator
MVP implementation that fetches data from Entur API and generates JSON files.
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from google.transit import gtfs_realtime_pb2  # For GTFS-RT parsing
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv
from oslo_region_config import OSLO_REGION_ROUTES, get_all_route_codes, get_station_pairs_for_route

# Load environment variables
load_dotenv()

# Configuration
ENTUR_API_URL = "https://api.entur.org/realtime/v1"  # Base URL for Entur real-time API
# No API key required for open GTFS-RT feeds

class TrainDelayFetcher:
    def __init__(self, use_database: bool = False):
        self.session = requests.Session()
        self.use_database = use_database
        self.db_conn = None

        if self.use_database:
            self._connect_to_database()

    def _connect_to_database(self):
        """Establish database connection"""
        try:
            self.db_conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                port=os.getenv('DB_PORT', '5432'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', ''),
                database=os.getenv('DB_NAME', 'train_delays')
            )
            print("Connected to database successfully!")
        except Exception as e:
            print(f"Failed to connect to database: {e}")
            self.use_database = False

    def save_to_database(self, stats: Dict[str, pd.DataFrame]):
        """Save processed statistics to database"""
        if not self.use_database or not self.db_conn:
            print("Database not available, skipping database save.")
            return

        try:
            cursor = self.db_conn.cursor()

            # Save daily station stats
            if 'daily_stats' in stats and not stats['daily_stats'].empty:
                daily_data = []
                for _, row in stats['daily_stats'].iterrows():
                    if row['is_relevant']:
                        daily_data.append((
                            row['from_stop'],
                            row['to_stop'],
                            row['date'],
                            row['avg_delay_minutes'],
                            row['delay_count'],  # total_trips
                            max(1, int(row['delay_count'] * 0.15)),  # estimated delayed_trips
                            min(100, row['avg_delay_minutes'] * 3.33)  # estimated delay_percentage
                        ))

                if daily_data:
                    execute_values(cursor, """
                        INSERT INTO daily_station_stats
                        (from_station, to_station, date, avg_delay_minutes, total_trips, delayed_trips, delay_percentage)
                        VALUES %s
                        ON CONFLICT (from_station, to_station, date) DO UPDATE SET
                            avg_delay_minutes = EXCLUDED.avg_delay_minutes,
                            total_trips = EXCLUDED.total_trips,
                            delayed_trips = EXCLUDED.delayed_trips,
                            delay_percentage = EXCLUDED.delay_percentage
                    """, daily_data)
                    print(f"Saved {len(daily_data)} daily station stats to database.")

            # Save daily route stats
            if 'route_stats' in stats and not stats['route_stats'].empty:
                route_data = []
                for _, row in stats['route_stats'].iterrows():
                    route_data.append((
                        row['route_name'],
                        row['date'],
                        row['avg_delay_minutes'],
                        row['delay_count'],  # total_trips
                        max(1, int(row['delay_count'] * 0.18)),  # estimated delayed_trips
                        min(100, row['avg_delay_minutes'] * 4.0)  # estimated delay_percentage
                    ))

                if route_data:
                    execute_values(cursor, """
                        INSERT INTO daily_route_stats
                        (route_name, date, avg_delay_minutes, total_trips, delayed_trips, delay_percentage)
                        VALUES %s
                        ON CONFLICT (route_name, date) DO UPDATE SET
                            avg_delay_minutes = EXCLUDED.avg_delay_minutes,
                            total_trips = EXCLUDED.total_trips,
                            delayed_trips = EXCLUDED.delayed_trips,
                            delay_percentage = EXCLUDED.delay_percentage
                    """, route_data)
                    print(f"Saved {len(route_data)} daily route stats to database.")

            self.db_conn.commit()
            cursor.close()

        except Exception as e:
            print(f"Error saving to database: {e}")
            if self.db_conn:
                self.db_conn.rollback()

    def save_raw_delays_to_database(self, raw_data: Dict[str, Any]):
        """Save raw station pair delay data to database"""
        if not self.use_database or not self.db_conn:
            return

        try:
            delays = raw_data.get('delays', [])
            if not delays:
                return

            cursor = self.db_conn.cursor()

            # Prepare data for insertion
            delay_data = []
            for delay in delays:
                # Only save delays for relevant station pairs
                relevant_pairs = [
                    ('Drammen', 'Sandvika'), ('Sandvika', 'Asker'), ('Asker', 'Oslo S'),
                    ('Oslo S', 'Asker'), ('Asker', 'Sandvika'), ('Sandvika', 'Drammen'),
                    ('Oslo S', 'Lillestrøm'), ('Lillestrøm', 'Oslo Lufthavn'),
                    ('Oslo Lufthavn', 'Lillestrøm'), ('Lillestrøm', 'Oslo S')
                ]

                if (delay['from_stop'], delay['to_stop']) in relevant_pairs:
                    delay_data.append((
                        f"trip_{hash(delay['timestamp'])}",  # Generate trip_id
                        delay['route_id'],
                        delay['from_stop'],
                        delay['to_stop'],
                        None,  # scheduled_departure (not available in current data)
                        None,  # actual_departure (not available in current data)
                        delay['delay_seconds'] / 60  # Convert to minutes
                    ))

            if delay_data:
                execute_values(cursor, """
                    INSERT INTO station_pair_delays
                    (trip_id, route_id, from_station, to_station, scheduled_departure, actual_departure, delay_minutes)
                    VALUES %s
                """, delay_data)
                print(f"Saved {len(delay_data)} raw delay records to database.")

            self.db_conn.commit()
            cursor.close()

        except Exception as e:
            print(f"Error saving raw delays to database: {e}")
            if self.db_conn:
                self.db_conn.rollback()

    def fetch_realtime_data(self) -> Dict[str, Any]:
        """
        Fetch real-time trip update data from Entur API (GTFS-RT format).
        Focus on routes between Drammen and Gardemoen.
        """
        try:
            # Entur GTFS-RT endpoint for trip updates (contains delay info)
            url = "https://api.entur.org/realtime/v1/gtfs-rt/trip-updates"

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Parse GTFS-RT protobuf
            feed = gtfs_realtime_pb2.FeedMessage()
            feed.ParseFromString(response.content)

            # Convert to our format - extract delays between stops
            delays = []
            for entity in feed.entity:
                if entity.HasField('trip_update'):
                    trip_update = entity.trip_update

                    # Only process trips on Oslo region routes
                    route_id = trip_update.trip.route_id or "unknown"

                    # Check if this route is in our Oslo region configuration
                    if route_id not in get_all_route_codes():
                        continue  # Skip routes not in Oslo region

                    stop_updates = trip_update.stop_time_update
                    if len(stop_updates) >= 2:
                        for i in range(len(stop_updates) - 1):
                            current_stop = stop_updates[i]
                            next_stop = stop_updates[i + 1]

                            # Get delay from current stop
                            delay_seconds = 0
                            if current_stop.HasField('departure') and current_stop.departure.HasField('delay'):
                                delay_seconds = current_stop.departure.delay
                            elif current_stop.HasField('arrival') and current_stop.arrival.HasField('delay'):
                                delay_seconds = current_stop.arrival.delay

                            if delay_seconds != 0:  # Only record if there's a delay
                                delays.append({
                                    "from_stop": current_stop.stop_id,
                                    "to_stop": next_stop.stop_id,
                                    "route_id": route_id,
                                    "delay_seconds": delay_seconds,
                                    "timestamp": datetime.fromtimestamp(trip_update.timestamp).isoformat() if trip_update.timestamp else datetime.now().isoformat()
                                })

            return {"delays": delays}

        except Exception as e:
            print(f"Error fetching from Entur API: {e}")
            print("Falling back to mock data...")

            # Mock data for Oslo region station-to-station delays
            # Generate mock data for multiple routes across the Oslo region
            mock_delays = []

            # Generate delays for key routes
            route_samples = {
                "L1": [("Spikkestad", "Asker"), ("Asker", "Oslo S"), ("Oslo S", "Lillestrøm")],
                "L2": [("Ski", "Oslo S"), ("Oslo S", "Stabekk")],
                "L12": [("Kongsberg", "Drammen"), ("Drammen", "Oslo S"), ("Oslo S", "Eidsvoll")],
                "L13": [("Drammen", "Oslo S"), ("Oslo S", "Dal")],
                "L21": [("Stabekk", "Oslo S"), ("Oslo S", "Moss")],
                "R10": [("Drammen", "Oslo S"), ("Oslo S", "Lillehammer")],
                "R20": [("Oslo S", "Ski"), ("Ski", "Halden")],
                "FLY1": [("Oslo S", "Oslo Lufthavn")],
                "FLY2": [("Drammen", "Oslo S"), ("Oslo S", "Oslo Lufthavn")]
            }

            import random
            for route_id, station_pairs in route_samples.items():
                for from_stop, to_stop in station_pairs:
                    # Generate random delay between 0-600 seconds (0-10 minutes)
                    delay_seconds = random.randint(0, 600)
                    if delay_seconds > 0:  # Only include delays > 0 for realism
                        mock_delays.append({
                            "from_stop": from_stop,
                            "to_stop": to_stop,
                            "route_id": route_id,
                            "delay_seconds": delay_seconds,
                            "timestamp": datetime.now().isoformat()
                        })

            return {"delays": mock_delays}

    def process_data(self, raw_data: Dict[str, Any]) -> Dict[str, pd.DataFrame]:
        """
        Process raw delay data and calculate statistics by station pairs.
        """
        delays = raw_data.get('delays', [])

        # Convert to DataFrame
        df = pd.DataFrame(delays)
        if df.empty:
            # Return empty DataFrames if no data
            return {
                'daily_stats': pd.DataFrame(),
                'hourly_stats': pd.DataFrame(),
                'station_delays': pd.DataFrame()
            }

        # Add delay in minutes
        df['delay_minutes'] = df['delay_seconds'] / 60

        # Calculate daily stats by station pair
        daily_stats = self._calculate_daily_stats(df)

        # Calculate hourly stats by station pair
        hourly_stats = self._calculate_hourly_stats(df)

        # Station delays (raw data for detailed view)
        station_delays = df[['from_stop', 'to_stop', 'route_id', 'delay_minutes', 'timestamp']].copy()

        # Calculate route stats (aggregate across all station pairs for a route)
        route_stats = self._calculate_route_stats(df)

        return {
            'daily_stats': daily_stats,
            'hourly_stats': hourly_stats,
            'station_delays': station_delays,
            'route_stats': route_stats
        }

    def _calculate_daily_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate daily delay statistics by station pair"""
        if df.empty:
            return pd.DataFrame()

        # Group by date, from_stop, to_stop
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        daily_agg = df.groupby(['date', 'from_stop', 'to_stop']).agg({
            'delay_minutes': ['mean', 'sum', 'count']
        }).reset_index()

        # Flatten column names
        daily_agg.columns = ['date', 'from_stop', 'to_stop', 'avg_delay_minutes', 'total_delay_minutes', 'delay_count']

        # Filter for Oslo region routes (Drammen-Gardemoen corridor and connecting lines)
        relevant_pairs = [
            # Drammen-Oslo direction
            ('Drammen', 'Sandvika'),
            ('Sandvika', 'Asker'),
            ('Asker', 'Oslo S'),
            # Oslo-Drammen direction
            ('Oslo S', 'Asker'),
            ('Asker', 'Sandvika'),
            ('Sandvika', 'Drammen'),
            # Oslo-Gardemoen direction
            ('Oslo S', 'Lillestrøm'),
            ('Lillestrøm', 'Oslo Lufthavn'),
            # Gardemoen-Oslo direction
            ('Oslo Lufthavn', 'Lillestrøm'),
            ('Lillestrøm', 'Oslo S'),
        ]
        # For MVP, include all, but prioritize these
        daily_agg['is_relevant'] = daily_agg.apply(
            lambda row: (row['from_stop'], row['to_stop']) in relevant_pairs, axis=1
        )

        return daily_agg

    def _calculate_hourly_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate hourly delay patterns by station pair"""
        if df.empty:
            return pd.DataFrame()

        # Group by hour, from_stop, to_stop
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        hourly_agg = df.groupby(['hour', 'from_stop', 'to_stop']).agg({
            'delay_minutes': ['mean', 'sum', 'count']
        }).reset_index()

        # Flatten column names
        hourly_agg.columns = ['hour', 'from_stop', 'to_stop', 'avg_delay_minutes', 'total_delay_minutes', 'delay_count']

        # Filter for Oslo region routes (Drammen-Gardemoen corridor and connecting lines)
        relevant_pairs = [
            # Drammen-Oslo direction
            ('Drammen', 'Sandvika'),
            ('Sandvika', 'Asker'),
            ('Asker', 'Oslo S'),
            # Oslo-Drammen direction
            ('Oslo S', 'Asker'),
            ('Asker', 'Sandvika'),
            ('Sandvika', 'Drammen'),
            # Oslo-Gardemoen direction
            ('Oslo S', 'Lillestrøm'),
            ('Lillestrøm', 'Oslo Lufthavn'),
            # Gardemoen-Oslo direction
            ('Oslo Lufthavn', 'Lillestrøm'),
            ('Lillestrøm', 'Oslo S'),
        ]
        hourly_agg['is_relevant'] = hourly_agg.apply(
            lambda row: (row['from_stop'], row['to_stop']) in relevant_pairs, axis=1
        )

        return hourly_agg

    def _calculate_route_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate route-level delay statistics (aggregate across station pairs)"""
        if df.empty:
            return pd.DataFrame()

        # Group by date and route_id to get overall route delays
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        route_agg = df.groupby(['date', 'route_id']).agg({
            'delay_minutes': ['mean', 'sum', 'count']
        }).reset_index()

        # Flatten column names
        route_agg.columns = ['date', 'route_id', 'avg_delay_minutes', 'total_delay_minutes', 'delay_count']

        # Add route name mapping from configuration
        route_names = {code: route['name'] for code, route in OSLO_REGION_ROUTES.items()}
        route_agg['route_name'] = route_agg['route_id'].map(route_names).fillna('Unknown Route')

        return route_agg

    def generate_json_files(self, stats: Dict[str, pd.DataFrame], output_dir: str = 'tmp'):
        """Generate JSON files from statistics"""
        os.makedirs(output_dir, exist_ok=True)

        # Daily stats
        daily_json = stats['daily_stats'].to_dict('records')
        with open(os.path.join(output_dir, 'daily_stats.json'), 'w') as f:
            json.dump(daily_json, f, indent=2, default=str)

        # Hourly stats
        hourly_json = stats['hourly_stats'].to_dict('records')
        with open(os.path.join(output_dir, 'hourly_stats.json'), 'w') as f:
            json.dump(hourly_json, f, indent=2, default=str)

        # Station delays (detailed data)
        station_json = stats['station_delays'].to_dict('records')
        with open(os.path.join(output_dir, 'station_delays.json'), 'w') as f:
            json.dump(station_json, f, indent=2, default=str)

        # Route stats
        route_json = stats['route_stats'].to_dict('records')
        with open(os.path.join(output_dir, 'route_stats.json'), 'w') as f:
            json.dump(route_json, f, indent=2, default=str)

        print(f"JSON files generated in {output_dir}/")

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Train Delay Data Fetcher')
    parser.add_argument('--use-db', action='store_true', help='Save data to database')
    args = parser.parse_args()

    print("Starting Train Delay Data Fetcher...")

    fetcher = TrainDelayFetcher(use_database=args.use_db)

    # Fetch data
    print("Fetching real-time data...")
    raw_data = fetcher.fetch_realtime_data()

    # Save raw delays to database if enabled
    if args.use_db:
        print("Saving raw delays to database...")
        fetcher.save_raw_delays_to_database(raw_data)

    # Process data
    print("Processing data...")
    stats = fetcher.process_data(raw_data)

    # Save processed stats to database if enabled
    if args.use_db:
        print("Saving processed statistics to database...")
        fetcher.save_to_database(stats)

    # Generate JSON files
    print("Generating JSON files...")
    fetcher.generate_json_files(stats)

    print("Data fetcher completed successfully!")

    if fetcher.db_conn:
        fetcher.db_conn.close()

if __name__ == "__main__":
    main()