"""
Module for database operations related to storing scraped offers
"""
import logging
import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime

# Import database setup functions and path
from ..db import setup_database, db_path


def clear_listings():
    """Clear all existing listings from the database"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM listings")
        conn.commit()
        conn.close()
        logging.info("Cleared existing listings from database")
        return True
    except Exception as e:
        logging.error(f"Failed to clear listings: {str(e)}")
        return False


def insert_listing(
    city: str, 
    district: str, 
    district_parent: str, 
    area: float, 
    price_per_sqm: int, 
    floor: int = 0,
    rooms: Optional[int] = None
) -> bool:
    """
    Insert a listing into the database
    
    Args:
        city: City name
        district: District name
        district_parent: Parent district name
        area: Area in square meters
        price_per_sqm: Price per square meter
        floor: Floor number (default: 0)
        rooms: Number of rooms (optional)
        
    Returns:
        True if insertion was successful, False otherwise
    """
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if the table exists, create it if it doesn't
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY,
            city TEXT,
            district TEXT,
            district_parent TEXT,
            area REAL,
            price_per_sqm INTEGER,
            floor INTEGER,
            rooms INTEGER,
            scraped_at TEXT
        )
        """)
        
        # Insert the listing
        cursor.execute(
            "INSERT INTO listings (city, district, district_parent, area, price_per_sqm, floor, rooms, scraped_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (city, district, district_parent, area, price_per_sqm, floor, rooms, datetime.utcnow().isoformat())
        )
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        logging.error(f"Failed to insert listing: {str(e)}")
        return False