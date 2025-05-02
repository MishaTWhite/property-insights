import sqlite3
import logging
import os
from datetime import datetime
from pathlib import Path

# Database file path - ensure it's created in the server/ directory
db_path = Path(__file__).resolve().parents[1] / 'otodom.db'  # /server/otodom.db
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

def database_exists():
    """Check if the database file exists"""
    return db_path.exists()