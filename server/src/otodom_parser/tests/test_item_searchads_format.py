import os
import sys
import json
import pytest

# Add parent directory to path to import the scraper module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scraper import OtodomScraper

def test_parse_offer_json_item_searchads_format():
    """Test parsing JSON offer data with the new searchAds.items format"""
    # Load the test fixture
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'item_searchAds.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        offer = json.load(f)
    
    # Create a scraper instance and parse the offer
    scraper = OtodomScraper()
    result = scraper.parse_offer_json(offer)
    
    # Assert the parsed values
    assert result is not None
    assert result['area'] == 42.5
    assert result['price_per_sqm'] == 10500
    assert result['floor'] == 2  # SECOND should map to 2
    assert result['city'] == 'warszawa'
    assert result['district'] == 'mokotow'

def test_parse_offer_json_item_searchads_calculate_price():
    """Test parsing JSON offer data with price calculation from totalPrice instead of pricePerSquareMeter"""
    # Load the test fixture
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'item_searchAds.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        offer = json.load(f)
    
    # Remove pricePerSquareMeter from the offer to test calculation
    del offer["pricePerSquareMeter"]
    
    # Create a scraper instance and parse the offer
    scraper = OtodomScraper()
    result = scraper.parse_offer_json(offer)
    
    # Assert the parsed values - price_per_sqm should be calculated as totalPrice.value / area
    assert result is not None
    assert result['area'] == 42.5
    assert result['price_per_sqm'] == 10500  # 446250 / 42.5 = 10500
    assert result['floor'] == 2
    assert result['city'] == 'warszawa'
    assert result['district'] == 'mokotow'

def test_item_searchads_data_path_extraction():
    """Test extracting offers with the new data path format"""
    # Create a test data structure
    test_data = {
        "props": {
            "pageProps": {
                "data": {
                    "searchAds": {
                        "items": [
                            {
                                "id": "12345678",
                                "areaInSquareMeters": 42.5,
                                "pricePerSquareMeter": {"value": 10500},
                                "floorNumber": "SECOND"
                            }
                        ]
                    }
                }
            }
        }
    }
    
    # Create a scraper instance and extract offers
    scraper = OtodomScraper()
    offers = scraper.extract_offers(test_data)
    
    # Assert the extracted offers
    assert isinstance(offers, list)
    assert len(offers) == 1
    assert offers[0]["id"] == "12345678"
    assert offers[0]["areaInSquareMeters"] == 42.5