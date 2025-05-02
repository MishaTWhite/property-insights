import os
import sys
import json
import pytest
from bs4 import BeautifulSoup

# Add parent directory to path to import the scraper module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scraper import OtodomScraper

def test_extract_offers():
    """Test extracting offers from different JSON structures"""
    scraper = OtodomScraper()
    
    # Test the old format
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'offers_page.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        old_format_data = json.load(f)
    
    offers = scraper.extract_offers(old_format_data)
    assert isinstance(offers, list)
    assert len(offers) == 2
    
    # Test the new format
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'next_data_sample.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        new_format_data = json.load(f)
    
    offers = scraper.extract_offers(new_format_data)
    assert isinstance(offers, list)
    assert len(offers) == 1
    
    # Test the newest format with "items" instead of "offers"
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'next_data_v3.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        newest_format_data = json.load(f)
    
    offers = scraper.extract_offers(newest_format_data)
    assert isinstance(offers, list)
    assert len(offers) == 1
    assert offers[0]["id"] == "65271823"

def test_parse_offer_json_old_format():
    """Test parsing JSON offer data with old format"""
    # Load the test fixture
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'offers_page.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        fixture_data = json.load(f)
    
    # Get the first offer from the fixture
    offer = fixture_data["props"]["pageProps"]["initialState"]["listingSearch"]["offers"][0]
    
    # Create a scraper instance and parse the offer
    scraper = OtodomScraper()
    result = scraper.parse_offer_json(offer)
    
    # Assert the parsed values
    assert result is not None
    assert result['area'] == 28.01
    assert result['price_per_sqm'] == 18500
    assert result['floor'] == 3
    assert result['city'] == 'warszawa'
    
def test_parse_offer_json_new_format():
    """Test parsing JSON offer data with new format (floorNumber instead of floor)"""
    # Load the test fixture
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'next_data_sample.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        fixture_data = json.load(f)
    
    # Get the first offer from the fixture using extract_offers helper
    scraper = OtodomScraper()
    offers = scraper.extract_offers(fixture_data)
    offer = offers[0]
    
    # Parse the offer
    result = scraper.parse_offer_json(offer)
    
    # Assert the parsed values
    assert result is not None
    assert result['area'] == 35.5
    assert result['price_per_sqm'] == 11268
    assert result['floor'] == 2
    assert result['city'] == 'szczecin'
    assert result['district'] == 'śródmieście'

def test_parse_offer_json_null_area():
    """Test parsing JSON offer data with null area value"""
    # Create a minimal offer with null area
    offer = {
        "id": "test123",
        "areaInSquareMeters": None,
        "totalPrice": {"value": 500000},
        "location": {"city": "warszawa", "district": "mokotów"}
    }
    
    # Create a scraper instance and parse the offer
    scraper = OtodomScraper()
    result = scraper.parse_offer_json(offer)
    
    # Offer with null area should be skipped (return None)
    assert result is None

def test_parse_offer_json_string_rooms():
    """Test parsing JSON offer data with roomsNumber as string enum"""
    # Create a test offer with roomsNumber as a string enum
    offer = {
        "id": "test456",
        "areaInSquareMeters": 50.0,
        "pricePerSquareMeter": {"value": 10000},
        "roomsNumber": "TWO",
        "location": {"city": "warszawa", "district": "mokotów"}
    }
    
    # Create a scraper instance and parse the offer
    scraper = OtodomScraper()
    result = scraper.parse_offer_json(offer)
    
    # Assert the rooms value was correctly mapped from string enum to int
    assert result is not None
    assert result['area'] == 50.0
    assert result['price_per_sqm'] == 10000
    assert result['rooms'] == 2