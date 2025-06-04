import sqlite3
import logging
import os
from datetime import datetime
from pathlib import Path

# Database file path - ensure it's created in the server/ directory
db_path = Path(__file__).resolve().parent / 'otodom.db'  # /server/src/otodom_parser/otodom.db
db_path.touch(exist_ok=True)  # creates file if absent

def get_connection():
    """Get a connection to the SQLite database"""
    try:
        conn = sqlite3.connect(db_path)
        return conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {str(e)}")
        raise

def setup_database():
    """Create the database schema if it doesn't exist"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Create the listings table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            district TEXT NOT NULL,
            district_parent TEXT NOT NULL,
            area REAL NOT NULL,          -- m²
            price_per_sqm REAL NOT NULL, -- zł
            floor INTEGER,               -- 0 = parter
            rooms INTEGER,               -- number of rooms
            scraped_at TEXT              -- ISO timestamp
        )
        ''')
        
        # Check if district_parent and rooms columns exist, add them if not
        cursor.execute("PRAGMA table_info(listings)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'district_parent' not in columns:
            cursor.execute('ALTER TABLE listings ADD COLUMN district_parent TEXT')
        if 'rooms' not in columns:
            cursor.execute('ALTER TABLE listings ADD COLUMN rooms INTEGER')
        
        conn.commit()
        conn.close()
        logging.info("Database setup complete")
    except sqlite3.Error as e:
        logging.error(f"Database setup error: {str(e)}")
        raise

def clear_listings():
    """Remove all listings from the database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM listings')
        conn.commit()
        conn.close()
        logging.info("Cleared all listings from database")
    except sqlite3.Error as e:
        logging.error(f"Error clearing listings: {str(e)}")
        raise

def insert_listing(city, district, district_parent, area, price_per_sqm, floor, rooms=None):
    """Insert a listing into the database"""
    try:
        # Ensure database is properly set up with all required columns
        setup_database()
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # Get current timestamp
        timestamp = datetime.now().isoformat()
        
        # Insert the listing
        cursor.execute('''
        INSERT INTO listings (city, district, district_parent, area, price_per_sqm, floor, rooms, scraped_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (city, district, district_parent, area, price_per_sqm, floor, rooms, timestamp))
        
        conn.commit()
        conn.close()
    except sqlite3.Error as e:
        logging.error(f"Error inserting listing: {str(e)}")
        # Don't raise the error, just log it to prevent crashes

def get_city_stats():
    """Get statistics per city"""
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row  # This enables column access by name
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT city,
               ROUND(AVG(price_per_sqm), 0) AS avg_price_sqm,
               COUNT(*) AS listing_count
        FROM listings
        GROUP BY city
        ORDER BY avg_price_sqm DESC
        ''')
        
        # Convert to list of dictionaries
        results = [dict(row) for row in cursor.fetchall()]
        
        conn.close()
        return results
    except sqlite3.Error as e:
        logging.error(f"Error getting city stats: {str(e)}")
        return []

def get_last_updated_timestamp():
    """Get the timestamp of the most recent scrape"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT MAX(scraped_at) FROM listings')
        result = cursor.fetchone()[0]
        
        conn.close()
        return result
    except sqlite3.Error as e:
        logging.error(f"Error getting last updated timestamp: {str(e)}")
        return None

def get_all_cities():
    """Get a list of all distinct cities in the database"""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT DISTINCT city FROM listings ORDER BY city')
        cities = [row[0] for row in cursor.fetchall()]
        
        conn.close()
        return cities
    except sqlite3.Error as e:
        logging.error(f"Error getting cities: {str(e)}")
        return []

def get_city_district_stats(city):
    """Get district statistics for a specific city, including room breakdowns, aggregated by parent district"""
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Execute a query that gets all needed stats grouped by district_parent
        cursor.execute('''
        SELECT 
            district_parent AS district,
            COUNT(*) AS count,
            ROUND(AVG(price_per_sqm), 0) AS avg_ppsqm,
            
            COUNT(CASE WHEN rooms = '1' THEN 1 END) AS room1_count,
            ROUND(AVG(CASE WHEN rooms = '1' THEN price_per_sqm END), 0) AS room1_avg,
            
            COUNT(CASE WHEN rooms = '2' THEN 1 END) AS room2_count,
            ROUND(AVG(CASE WHEN rooms = '2' THEN price_per_sqm END), 0) AS room2_avg,
            
            COUNT(CASE WHEN rooms IS NOT NULL AND rooms != '1' AND rooms != '2' THEN 1 END) AS room3plus_count,
            ROUND(AVG(CASE WHEN rooms IS NOT NULL AND rooms != '1' AND rooms != '2' THEN price_per_sqm END), 0) AS room3plus_avg
        FROM 
            listings
        WHERE 
            city = ? AND district_parent IS NOT NULL
        GROUP BY 
            district_parent
        ORDER BY 
            avg_ppsqm DESC
        ''', (city,))
        
        rows = cursor.fetchall()
        results = []
        
        for row in rows:
            # Convert SQLite Row to dictionary and restructure for the API
            district_data = dict(row)
            
            # Create nested room stats structure
            district_data["rooms"] = {
                "1": {
                    "count": district_data.pop("room1_count") or 0,
                    "avg_ppsqm": district_data.pop("room1_avg")
                },
                "2": {
                    "count": district_data.pop("room2_count") or 0,
                    "avg_ppsqm": district_data.pop("room2_avg")
                },
                "3+": {
                    "count": district_data.pop("room3plus_count") or 0,
                    "avg_ppsqm": district_data.pop("room3plus_avg")
                }
            }
            
            # Get all child districts for this parent district
            cursor.execute('''
            SELECT 
                district,
                COUNT(*) AS count,
                ROUND(AVG(price_per_sqm), 0) AS avg_ppsqm,
                
                COUNT(CASE WHEN rooms = '1' THEN 1 END) AS room1_count,
                ROUND(AVG(CASE WHEN rooms = '1' THEN price_per_sqm END), 0) AS room1_avg,
                
                COUNT(CASE WHEN rooms = '2' THEN 1 END) AS room2_count,
                ROUND(AVG(CASE WHEN rooms = '2' THEN price_per_sqm END), 0) AS room2_avg,
                
                COUNT(CASE WHEN rooms IS NOT NULL AND rooms != '1' AND rooms != '2' THEN 1 END) AS room3plus_count,
                ROUND(AVG(CASE WHEN rooms IS NOT NULL AND rooms != '1' AND rooms != '2' THEN price_per_sqm END), 0) AS room3plus_avg
            FROM 
                listings
            WHERE 
                city = ? AND district_parent = ?
            GROUP BY 
                district
            ORDER BY 
                avg_ppsqm DESC
            ''', (city, district_data['district']))
            
            child_rows = cursor.fetchall()
            child_districts = []
            
            for child_row in child_rows:
                child_data = dict(child_row)
                
                # Create nested room stats structure for child district
                child_data["rooms"] = {
                    "1": {
                        "count": child_data.pop("room1_count") or 0,
                        "avg_ppsqm": child_data.pop("room1_avg")
                    },
                    "2": {
                        "count": child_data.pop("room2_count") or 0,
                        "avg_ppsqm": child_data.pop("room2_avg")
                    },
                    "3+": {
                        "count": child_data.pop("room3plus_count") or 0,
                        "avg_ppsqm": child_data.pop("room3plus_avg")
                    }
                }
                
                child_districts.append(child_data)
            
            # Add child districts to parent district data
            district_data["child_districts"] = child_districts
            
            results.append(district_data)
        
        conn.close()
        return results
    except sqlite3.Error as e:
        logging.error(f"Error getting district stats: {str(e)}")
        return []

def get_city_stats(city):
    """Get overall statistics for a specific city"""
    try:
        conn = get_connection()
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('''
        SELECT
            city,
            ROUND(AVG(price_per_sqm), 0) AS avg_price_sqm,
            COUNT(*) AS listing_count
        FROM 
            listings
        WHERE
            city = ?
        GROUP BY
            city
        ''', (city,))
        
        result = cursor.fetchone()
        
        if result:
            # Convert to dict for JSON serialization
            city_stats = dict(result)
            # Get district stats
            city_stats["districts"] = get_city_district_stats(city)
            return city_stats
        else:
            return {
                "city": city,
                "avg_price_sqm": None,
                "listing_count": 0,
                "districts": []
            }
    except sqlite3.Error as e:
        logging.error(f"Error getting city stats: {str(e)}")
        return {
            "city": city,
            "avg_price_sqm": None,
            "listing_count": 0,
            "districts": []
        }

def database_exists():
    """Check if the database file exists"""
    return db_path.exists()