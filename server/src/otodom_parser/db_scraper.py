import sqlite3
import logging
import time
from pathlib import Path

# Database file path - ensure it's in the same location as db.py
db_path = Path(__file__).resolve().parent / 'otodom.db'  # /server/src/otodom_parser/otodom.db
db_path.touch(exist_ok=True)  # creates file if absent

class ScraperDB:
    def __init__(self, db_path_param=None):
        """Initialize the database connection"""
        # Use provided path or fallback to the module-level db_path defined above
        self.db_path = Path(db_path_param) if db_path_param is not None else db_path
        self.setup_database()
        
    def get_connection(self):
        """Get a connection to the SQLite database"""
        try:
            conn = sqlite3.connect(self.db_path)
            return conn
        except sqlite3.Error as e:
            logging.error(f"Database connection error: {str(e)}")
            raise
            
    def setup_database(self):
        """Create the database schema if it doesn't exist"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Create the offers table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS offers (
                id TEXT PRIMARY KEY,
                title TEXT,
                url TEXT,
                city TEXT,
                district TEXT,
                street TEXT,
                price REAL,
                currency TEXT,
                rooms INTEGER,
                area REAL,
                rent REAL,
                deposit REAL,
                floor INTEGER,
                building_floors INTEGER,
                building_type TEXT,
                lat REAL,
                lon REAL,
                image TEXT,
                created_at TEXT,
                scraped_at REAL
            )
            ''')
            
            # Check if columns exist, add them if not
            cursor.execute("PRAGMA table_info(offers)")
            columns = [column[1] for column in cursor.fetchall()]
            
            required_columns = {
                "rooms": "INTEGER",
                "building_type": "TEXT",
                "building_floors": "INTEGER",
                "lat": "REAL",
                "lon": "REAL",
                "image": "TEXT",
                "created_at": "TEXT"
            }
            
            for col_name, col_type in required_columns.items():
                if col_name not in columns:
                    cursor.execute(f'ALTER TABLE offers ADD COLUMN {col_name} {col_type}')
                    
            conn.commit()
            conn.close()
            logging.info("Database setup complete")
        except sqlite3.Error as e:
            logging.error(f"Database setup error: {str(e)}")
            raise
            
    def insert_offer(self, offer):
        """Insert or update an offer in the database"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Check if offer already exists
            cursor.execute("SELECT id FROM offers WHERE id = ?", (offer["id"],))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing offer
                cursor.execute('''
                UPDATE offers SET
                    title = ?,
                    url = ?,
                    city = ?,
                    district = ?,
                    street = ?,
                    price = ?,
                    currency = ?,
                    rooms = ?,
                    area = ?,
                    rent = ?,
                    deposit = ?,
                    floor = ?,
                    building_floors = ?,
                    building_type = ?,
                    lat = ?,
                    lon = ?,
                    image = ?,
                    created_at = ?,
                    scraped_at = ?
                WHERE id = ?
                ''', (
                    offer.get("title"),
                    offer.get("url"),
                    offer.get("city"),
                    offer.get("district"),
                    offer.get("street"),
                    offer.get("price"),
                    offer.get("currency"),
                    offer.get("rooms"),
                    offer.get("area"),
                    offer.get("rent"),
                    offer.get("deposit"),
                    offer.get("floor"),
                    offer.get("building_floors"),
                    offer.get("building_type"),
                    offer.get("lat"),
                    offer.get("lon"),
                    offer.get("image"),
                    offer.get("created_at"),
                    offer.get("scraped_at"),
                    offer["id"]
                ))
            else:
                # Insert new offer
                cursor.execute('''
                INSERT INTO offers (
                    id, title, url, city, district, street, price, currency,
                    rooms, area, rent, deposit, floor, building_floors, building_type,
                    lat, lon, image, created_at, scraped_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    offer["id"],
                    offer.get("title"),
                    offer.get("url"),
                    offer.get("city"),
                    offer.get("district"),
                    offer.get("street"),
                    offer.get("price"),
                    offer.get("currency"),
                    offer.get("rooms"),
                    offer.get("area"),
                    offer.get("rent"),
                    offer.get("deposit"),
                    offer.get("floor"),
                    offer.get("building_floors"),
                    offer.get("building_type"),
                    offer.get("lat"),
                    offer.get("lon"),
                    offer.get("image"),
                    offer.get("created_at"),
                    offer.get("scraped_at")
                ))
                
            conn.commit()
            conn.close()
            return True
        except sqlite3.Error as e:
            logging.error(f"Error inserting offer {offer.get('id')}: {str(e)}")
            return False
            
    def get_recent_ids(self, cutoff_time):
        """Get IDs of offers scraped after the cutoff time"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("SELECT id FROM offers WHERE scraped_at >= ?", (cutoff_time,))
            ids = [row[0] for row in cursor.fetchall()]
            
            conn.close()
            return ids
        except sqlite3.Error as e:
            logging.error(f"Error getting recent IDs: {str(e)}")
            return []
            
    def clear_old_offers(self, exclude_ids=None):
        """Clear old offers from the database, optionally excluding specific IDs"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if exclude_ids and len(exclude_ids) > 0:
                # Create placeholders for the SQL query
                placeholders = ','.join(['?'] * len(exclude_ids))
                cursor.execute(f"DELETE FROM offers WHERE id NOT IN ({placeholders})", exclude_ids)
            else:
                cursor.execute("DELETE FROM offers")
                
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            logging.info(f"Cleared {deleted_count} old offers from database")
            return deleted_count
        except sqlite3.Error as e:
            logging.error(f"Error clearing old offers: {str(e)}")
            return 0
            
    def count_offers(self, city=None, district=None):
        """Count offers matching the given filters"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            query = "SELECT COUNT(*) FROM offers"
            params = []
            
            where_clauses = []
            if city:
                where_clauses.append("city = ?")
                params.append(city.lower())
            if district:
                where_clauses.append("district = ?")
                params.append(district.lower())
                
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
                
            cursor.execute(query, params)
            count = cursor.fetchone()[0]
            
            conn.close()
            return count
        except sqlite3.Error as e:
            logging.error(f"Error counting offers: {str(e)}")
            return 0
            
    def get_offers(self, city=None, district=None, limit=1000, offset=0):
        """Get offers matching the given filters"""
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            query = "SELECT * FROM offers"
            params = []
            
            where_clauses = []
            if city:
                where_clauses.append("city = ?")
                params.append(city.lower())
            if district:
                where_clauses.append("district = ?")
                params.append(district.lower())
                
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
                
            query += " ORDER BY scraped_at DESC LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            offers = [dict(row) for row in rows]
            
            conn.close()
            return offers
        except sqlite3.Error as e:
            logging.error(f"Error getting offers: {str(e)}")
            return []
            
    def get_offer(self, offer_id):
        """Get a single offer by ID"""
        try:
            conn = self.get_connection()
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM offers WHERE id = ?", (offer_id,))
            row = cursor.fetchone()
            
            if row:
                offer = dict(row)
                conn.close()
                return offer
            else:
                conn.close()
                return None
        except sqlite3.Error as e:
            logging.error(f"Error getting offer {offer_id}: {str(e)}")
            return None