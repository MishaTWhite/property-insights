import unittest
import sqlite3
from unittest.mock import patch, MagicMock
import db

class TestDbFunctions(unittest.TestCase):
    
    @patch('db.get_connection')
    def test_get_city_district_stats(self, mock_get_connection):
        # Mock connection and cursor
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_conn.cursor.return_value = mock_cursor
        mock_get_connection.return_value = mock_conn
        
        # Mock fetchall to return sample data
        mock_cursor.fetchall.return_value = [
            {"district": "mokotow", "count": 10, "avg_ppsqm": 15000, 
             "room1_count": 2, "room1_avg": 16000, 
             "room2_count": 5, "room2_avg": 15500, 
             "room3plus_count": 3, "room3plus_avg": 14000}
        ]
        
        # Call the function with a test city
        result = db.get_city_district_stats("warszawa")
        
        # Verify the function was called with the correct SQL
        mock_cursor.execute.assert_called()
        
        # Check that the city parameter was used in the query
        args = mock_cursor.execute.call_args[0][1]
        self.assertEqual(args, ("warszawa",))
        
        # Check the returned structure
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["district"], "mokotow")
        self.assertEqual(result[0]["count"], 10)
        self.assertEqual(result[0]["avg_ppsqm"], 15000)
        self.assertEqual(result[0]["rooms"]["1"]["count"], 2)
        self.assertEqual(result[0]["rooms"]["1"]["avg_ppsqm"], 16000)
        self.assertEqual(result[0]["rooms"]["2"]["count"], 5)
        self.assertEqual(result[0]["rooms"]["2"]["avg_ppsqm"], 15500)
        self.assertEqual(result[0]["rooms"]["3+"]["count"], 3)
        self.assertEqual(result[0]["rooms"]["3+"]["avg_ppsqm"], 14000)

if __name__ == '__main__':
    unittest.main()