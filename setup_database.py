#!/usr/bin/env python3
"""
Database Setup Script for Train Delay Dashboard
Creates PostgreSQL database and tables for storing train delay data.
"""

import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv
from oslo_region_config import OSLO_REGION_STATIONS

# Load environment variables
load_dotenv()

def create_database():
    """Create the train_delays database if it doesn't exist"""
    try:
        # Connect to default postgres database to create our database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            database='postgres'
        )
        conn.autocommit = True
        cursor = conn.cursor()

        # Create database if it doesn't exist
        db_name = os.getenv('DB_NAME', 'train_delays')
        cursor.execute(sql.SQL("CREATE DATABASE {}").format(sql.Identifier(db_name)))
        print(f"Database '{db_name}' created successfully!")

        cursor.close()
        conn.close()
        return True

    except psycopg2.OperationalError as e:
        if "Connection refused" in str(e) or "server at" in str(e):
            print("PostgreSQL server is not running or not accessible.")
            print("To set up the database:")
            print("1. Install PostgreSQL on your system")
            print("2. Start PostgreSQL service: brew services start postgresql (on macOS)")
            print("3. Create a database user and set password")
            print("4. Update the .env file with your database credentials")
            print("5. Run this script again")
            return False
        else:
            print(f"Database error: {e}")
            return False
    except psycopg2.errors.DuplicateDatabase:
        print(f"Database '{os.getenv('DB_NAME', 'train_delays')}' already exists.")
        return True
    except Exception as e:
        print(f"Error creating database: {e}")
        return False

def create_tables():
    """Create all necessary tables for the train delay system"""
    try:
        # Connect to our database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            database=os.getenv('DB_NAME', 'train_delays')
        )
        cursor = conn.cursor()

        # Create stations table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stations (
                station_code VARCHAR(10) PRIMARY KEY,
                station_name VARCHAR(255) NOT NULL,
                latitude FLOAT,
                longitude FLOAT,
                station_order INTEGER
            );
        """)
        print("Created stations table.")

        # Create station_pair_delays table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS station_pair_delays (
                id SERIAL PRIMARY KEY,
                trip_id VARCHAR(255),
                route_id VARCHAR(255),
                from_station VARCHAR(10),
                to_station VARCHAR(10),
                scheduled_departure TIMESTAMP,
                actual_departure TIMESTAMP,
                delay_minutes INTEGER,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("Created station_pair_delays table.")

        # Create daily_station_stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_station_stats (
                id SERIAL PRIMARY KEY,
                from_station VARCHAR(10),
                to_station VARCHAR(10),
                date DATE,
                avg_delay_minutes FLOAT,
                total_trips INTEGER,
                delayed_trips INTEGER,
                delay_percentage FLOAT,
                UNIQUE(from_station, to_station, date)
            );
        """)
        print("Created daily_station_stats table.")

        # Create daily_route_stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_route_stats (
                id SERIAL PRIMARY KEY,
                route_name VARCHAR(255),
                date DATE,
                avg_delay_minutes FLOAT,
                total_trips INTEGER,
                delayed_trips INTEGER,
                delay_percentage FLOAT,
                UNIQUE(route_name, date)
            );
        """)
        print("Created daily_route_stats table.")

        # Create hourly_station_stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hourly_station_stats (
                id SERIAL PRIMARY KEY,
                from_station VARCHAR(10),
                to_station VARCHAR(10),
                hour INTEGER,
                avg_delay_minutes FLOAT,
                total_trips INTEGER,
                delayed_trips INTEGER,
                delay_percentage FLOAT,
                UNIQUE(from_station, to_station, hour)
            );
        """)
        print("Created hourly_station_stats table.")

        # Create hourly_route_stats table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS hourly_route_stats (
                id SERIAL PRIMARY KEY,
                route_name VARCHAR(255),
                hour INTEGER,
                avg_delay_minutes FLOAT,
                total_trips INTEGER,
                delayed_trips INTEGER,
                delay_percentage FLOAT,
                UNIQUE(route_name, hour)
            );
        """)
        print("Created hourly_route_stats table.")

        # Insert all Oslo region stations from configuration
        stations_data = []
        for i, (station_code, station_info) in enumerate(OSLO_REGION_STATIONS.items(), 1):
            stations_data.append((
                station_code,
                station_info['name'],
                station_info['latitude'],
                station_info['longitude'],
                i  # station_order
            ))

        cursor.executemany("""
            INSERT INTO stations (station_code, station_name, latitude, longitude, station_order)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (station_code) DO NOTHING;
        """, stations_data)
        print(f"Inserted {len(stations_data)} stations from Oslo region configuration.")

        conn.commit()
        cursor.close()
        conn.close()

        print("All tables created successfully!")
        return True

    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

def main():
    """Main setup function"""
    print("Setting up Train Delay Dashboard Database...")

    # Create database
    if not create_database():
        print("Failed to create database. Exiting.")
        return

    # Create tables
    if not create_tables():
        print("Failed to create tables. Exiting.")
        return

    print("Database setup completed successfully!")
    print("\nNext steps:")
    print("1. Update your .env file with database credentials")
    print("2. Test the data fetcher with database integration")
    print("3. Set up automated data collection with cron jobs")

if __name__ == "__main__":
    main()