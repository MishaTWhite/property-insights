import os
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

# Import modules from parent directory
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from db import setup_database, get_connection, insert_listing


class TestDatabaseMigration(unittest.TestCase):
    def setUp(self):
        # Create a temporary database file
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.temp_db_path = self.temp_db.name
        self.temp_db.close()
        
        # Override the DB_PATH
        self.patcher = patch('db.DB_PATH', self.temp_db_path)
        self.mock_db_path = self.patcher.start()
        
    def tearDown(self):
        self.patcher.stop()
        # Remove the temporary database file
        os.unlink(self.temp_db_path)
    
    def test_room_column_migration(self):
        """Test that the rooms column is added to old schema databases"""
        # Create an "old" database schema without the rooms column
        conn = sqlite3.connect(self.temp_db_path)
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            district TEXT NOT NULL,
            district_parent TEXT NOT NULL,
            area REAL NOT NULL,
            price_per_sqm REAL NOT NULL,
            floor INTEGER,
            scraped_at TEXT
        )
        ''')
        conn.commit()
        conn.close()
        
        # Verify rooms column doesn't exist
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(listings)")
        columns = [column[1] for column in cursor.fetchall()]
        self.assertNotIn('rooms', columns)
        conn.close()
        
        # Call setup_database to perform migration
        setup_database()
        
        # Verify rooms column was added
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(listings)")
        columns = [column[1] for column in cursor.fetchall()]
        self.assertIn('rooms', columns)
        conn.close()
        
        # Test inserting data with rooms value
        insert_listing('warszawa', 'mokotow', 'mokotow', 50.0, 15000, 3, rooms=2)
        
        # Verify the data was inserted correctly with the rooms value
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT rooms FROM listings WHERE city='warszawa' AND district='mokotow'")
        result = cursor.fetchone()
        self.assertEqual(result[0], 2)
        conn.close()


if __name__ == '__main__':
    unittest.main()