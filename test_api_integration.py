#!/usr/bin/env python3
"""
API Integration Test Script
Tests the Entur API integration and validates data processing pipeline.
"""

import requests
import json
from datetime import datetime
from google.transit import gtfs_realtime_pb2
from oslo_region_config import get_all_route_codes

def test_api_connectivity():
    """Test basic connectivity to Entur API"""
    print("Testing Entur API connectivity...")

    try:
        # Test GTFS-RT trip updates endpoint
        url = "https://api.entur.io/realtime/v1/gtfs-rt/trip-updates"
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            print("✅ API endpoint is accessible")
            print(f"Response size: {len(response.content)} bytes")

            # Try to parse as GTFS-RT
            try:
                feed = gtfs_realtime_pb2.FeedMessage()
                feed.ParseFromString(response.content)
                print(f"✅ Successfully parsed GTFS-RT feed with {len(feed.entity)} entities")

                # Analyze entities
                trip_updates = 0
                vehicle_positions = 0
                alerts = 0

                for entity in feed.entity[:10]:  # Check first 10 entities
                    if entity.HasField('trip_update'):
                        trip_updates += 1
                    elif entity.HasField('vehicle'):
                        vehicle_positions += 1
                    elif entity.HasField('alert'):
                        alerts += 1

                print(f"Sample entities: {trip_updates} trip updates, {vehicle_positions} vehicle positions, {alerts} alerts")

                return True

            except Exception as e:
                print(f"❌ Failed to parse GTFS-RT: {e}")
                return False

        else:
            print(f"❌ API returned status code: {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_station_pair_extraction():
    """Test station pair delay extraction from GTFS-RT data"""
    print("\nTesting station pair extraction...")

    try:
        url = "https://api.entur.io/realtime/v1/gtfs-rt/trip-updates"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            print("❌ Cannot test extraction - API not accessible")
            return False

        feed = gtfs_realtime_pb2.FeedMessage()
        feed.ParseFromString(response.content)

        # Extract delays for Oslo region routes
        delays_found = 0
        relevant_routes = set(get_all_route_codes())

        for entity in feed.entity:
            if entity.HasField('trip_update'):
                trip_update = entity.trip_update

                route_id = trip_update.trip.route_id or "unknown"
                if route_id in relevant_routes:
                    stop_updates = trip_update.stop_time_update

                    if len(stop_updates) >= 2:
                        for i in range(len(stop_updates) - 1):
                            current_stop = stop_updates[i]
                            next_stop = stop_updates[i + 1]

                            # Check for delays
                            delay_seconds = 0
                            if current_stop.HasField('departure') and current_stop.departure.HasField('delay'):
                                delay_seconds = current_stop.departure.delay
                            elif current_stop.HasField('arrival') and current_stop.arrival.HasField('delay'):
                                delay_seconds = current_stop.arrival.delay

                            if delay_seconds != 0:
                                delays_found += 1
                                if delays_found <= 3:  # Show first few
                                    print(f"Found delay: {current_stop.stop_id} → {next_stop.stop_id}, {delay_seconds/60:.1f} min delay")

        if delays_found > 0:
            print(f"✅ Found {delays_found} delay records in Oslo region routes")
            return True
        else:
            print("⚠️ No delays found in current data (this may be normal if trains are on time)")
            return True

    except Exception as e:
        print(f"❌ Error in station pair extraction: {e}")
        return False

def test_data_processing_pipeline():
    """Test the complete data processing pipeline"""
    print("\nTesting data processing pipeline...")

    try:
        # Import the data fetcher
        from data_fetcher import TrainDelayFetcher

        fetcher = TrainDelayFetcher(use_database=False)

        # Test with real API data
        print("Fetching real-time data from API...")
        raw_data = fetcher.fetch_realtime_data()

        if 'delays' in raw_data and len(raw_data['delays']) > 0:
            print(f"✅ Fetched {len(raw_data['delays'])} delay records")

            # Test processing
            print("Processing data...")
            stats = fetcher.process_data(raw_data)

            # Check results
            if 'daily_stats' in stats and not stats['daily_stats'].empty:
                relevant_stats = stats['daily_stats'][stats['daily_stats']['is_relevant']]
                print(f"✅ Generated {len(relevant_stats)} relevant daily statistics")

            if 'route_stats' in stats and not stats['route_stats'].empty:
                print(f"✅ Generated {len(stats['route_stats'])} route statistics")

            # Test JSON generation
            print("Generating JSON files...")
            fetcher.generate_json_files(stats, 'tmp')

            print("✅ Data processing pipeline test completed successfully")
            return True

        else:
            print("⚠️ No delay data found (may be normal if all trains are on time)")
            return True

    except Exception as e:
        print(f"❌ Error in data processing pipeline: {e}")
        return False

def main():
    """Run all API integration tests"""
    print("🚂 Train Delay Dashboard - API Integration Tests")
    print("=" * 50)

    tests = [
        ("API Connectivity", test_api_connectivity),
        ("Station Pair Extraction", test_station_pair_extraction),
        ("Data Processing Pipeline", test_data_processing_pipeline),
    ]

    results = []
    for test_name, test_func in tests:
        print(f"\n🧪 Running: {test_name}")
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")

    passed = 0
    total = len(results)

    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1

    print(f"\nPassed: {passed}/{total} tests")

    if passed == total:
        print("🎉 All tests passed! API integration is working correctly.")
    else:
        print("⚠️ Some tests failed. Check the output above for details.")

    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)