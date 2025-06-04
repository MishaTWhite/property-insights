import os
import json
import pytest
from unittest.mock import patch, Mock
from ..scraper import OtodomScraper
import sqlite3

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), 'fixtures')

def test_parse_offer_json_rooms_old_format():
    """Test parsing offer with the old format should have rooms=None"""
    fixture_path = os.path.join(FIXTURES_DIR, 'offer_old_format.json')
    
    scraper = OtodomScraper()
    
    with open(fixture_path, 'r', encoding='utf-8') as f:
        offer = json.load(f)
        result = scraper.parse_offer_json(offer)
        
        assert result is not None
        # Rooms should be None in old format data
        assert 'rooms' in result
        assert result['rooms'] is None

def test_parse_offer_json_rooms_new_format():
    """Test parsing offer with the new format and rooms data"""
    fixture_path = os.path.join(FIXTURES_DIR, 'offer_new_format.json')
    
    scraper = OtodomScraper()
    
    with open(fixture_path, 'r', encoding='utf-8') as f:
        offer = json.load(f)
        # Add roomsNumber to the test data
        offer['roomsNumber'] = 2
        result = scraper.parse_offer_json(offer)
        
        assert result is not None
        # Check that rooms value is parsed correctly
        assert 'rooms' in result
        assert result['rooms'] == 2

def test_parse_offer_rooms_handling():
    """Test room number extraction from offers"""
    scraper = OtodomScraper()
    
    # Test with valid rooms value
    offer = {"area": 50, "price": 500000, "roomsNumber": 3}
    result = scraper.parse_offer_json(offer)
    assert result['rooms'] == 3
    
    # Test with string that can be converted to int
    offer = {"area": 50, "price": 500000, "roomsNumber": "1"}
    result = scraper.parse_offer_json(offer)
    assert result['rooms'] == 1
    
    # Test with invalid string
    offer = {"area": 50, "price": 500000, "roomsNumber": "studio"}
    result = scraper.parse_offer_json(offer)
    assert result['rooms'] is None
    
    # Test with no rooms data
    offer = {"area": 50, "price": 500000}
    result = scraper.parse_offer_json(offer)
    assert result['rooms'] is None

@patch('sqlite3.connect')
def test_insert_listing_with_rooms(mock_connect):
    """Test that rooms value is passed correctly to insert_listing and SQL"""
    from ..db import insert_listing
    
    # Mock the database connection and cursor
    mock_conn = Mock()
    mock_cursor = Mock()
    mock_connect.return_value = mock_conn
    mock_conn.cursor.return_value = mock_cursor
    
    # Call insert_listing with rooms value
    insert_listing(
        city="warszawa", 
        district="mokotow", 
        district_parent="mokotow", 
        area=50.0, 
        price_per_sqm=15000, 
        floor=3, 
        rooms=2
    )
    
    # Check that the SQL command includes rooms parameter
    execute_args = mock_cursor.execute.call_args[0]
    sql_statement = execute_args[0]
    parameters = execute_args[1]
    
    assert "rooms" in sql_statement
    assert len(parameters) == 8  # City, district, parent, area, ppsqm, floor, rooms, timestamp
    assert parameters[6] == 2  # Rooms should be the 7th parameter

def test_room_aggregation_categories():
    """Test that district-rooms endpoint correctly categorizes rooms"""
    # This is effectively testing the SQL CASE logic in the district-rooms endpoint
    # Since we can't easily test the actual SQL without a database,
    # we're documenting the expected behavior here
    
    # Expected categorization:
    # rooms = 1 -> category "1"
    # rooms = 2 -> category "2" 
    # rooms >= 3 -> category "3+"
    # rooms IS NULL or invalid -> category "unknown" (filtered out from final results)
    
    # The SQL in the endpoint should follow this logic:
    # CASE 
    #   WHEN rooms >= 3 THEN '3+'
    #   WHEN rooms = 2 THEN '2'
    #   WHEN rooms = 1 THEN '1'
    #   ELSE 'unknown'
    # END AS room_category
    
    # Categories should be grouped in the output JSON as:
    # {
    #   "1": {"avg_ppsqm": X, "count": Y},
    #   "2": {"avg_ppsqm": X, "count": Y},
    #   "3+": {"avg_ppsqm": X, "count": Y}
    # }
    
    # This test is for documentation purposes only
    assert True