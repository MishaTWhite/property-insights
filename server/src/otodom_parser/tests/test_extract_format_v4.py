import os
import sys
import json
import pytest
from bs4 import BeautifulSoup

# Add parent directory to path to import the scraper module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from scraper import OtodomScraper

def test_extract_offers_next_data_v4_format():
    """Test extracting offers from the newest Next.js format using 'results' field"""
    scraper = OtodomScraper()
    
    # Load the test fixture with v4 format (results field)
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'next_data_v4.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        v4_format_data = json.load(f)
    
    offers = scraper.extract_offers(v4_format_data)
    
    # Verify we got the expected offers
    assert isinstance(offers, list)
    assert len(offers) == 1
    assert offers[0]["id"] == "65912456"
    assert offers[0]["areaInM2"] == 42.0
    assert offers[0]["price"] == 500000
    assert offers[0]["floorNumber"] == 3
    assert offers[0]["location"]["city"] == "Warszawa"
    assert offers[0]["location"]["district"] == "Mokotów"
    
def test_parse_offer_json_with_price_calculation():
    """Test that price_per_sqm is calculated when not provided in the offer"""
    # Load the test fixture
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'next_data_v4.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        fixture_data = json.load(f)
    
    # Get the first offer from the fixture using extract_offers helper
    scraper = OtodomScraper()
    offers = scraper.extract_offers(fixture_data)
    offer = offers[0]
    
    # This offer has price and area but no pricePerSqm
    assert "price" in offer
    assert "areaInM2" in offer
    assert "pricePerSqm" not in offer
    
    # Parse the offer - should calculate price_per_sqm
    result = scraper.parse_offer_json(offer)
    
    # Assert the parsed values
    assert result is not None
    assert result['area'] == 42.0
    # Check calculated price_per_sqm (500000 / 42.0 ≈ 11905)
    assert result['price_per_sqm'] == round(500000 / 42.0)  # Should be 11905
    assert result['floor'] == 3
    assert result['city'] == 'warszawa'
    assert result['district'] == 'mokotów'

def test_extract_offers_from_json_ld_product():
    """Test extracting offers from JSON-LD Product format as fallback"""
    scraper = OtodomScraper()
    
    # Create a mock BeautifulSoup object with JSON-LD
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', 'product_ld_sample.json')
    with open(fixture_path, 'r', encoding='utf-8') as f:
        json_ld_data = json.load(f)
    
    # Create a minimal HTML structure with JSON-LD
    html_content = f"""
    <html>
    <head>
        <script type="application/ld+json">
        {json.dumps(json_ld_data)}
        </script>
    </head>
    <body></body>
    </html>
    """
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Call extract_offers with an empty Next.js data and the soup object
    # Since Next.js data is empty, it should fall back to JSON-LD
    offers = scraper.extract_offers({}, soup=soup)
    
    # Verify we got the expected offers
    assert isinstance(offers, list)
    assert len(offers) == 2
    
    # Check first offer
    assert offers[0]["price"] == 600000
    assert offers[0]["areaInM2"] == 35.0
    assert offers[0]["location"]["city"] == "Warszawa"
    assert offers[0]["location"]["district"] == "unknown"
    
    # Check second offer
    assert offers[1]["price"] == 750000
    assert offers[1]["areaInM2"] == 45.5
    assert offers[1]["location"]["city"] == "Warszawa"
    assert "pricePerSqm" in offers[1]
    assert offers[1]["pricePerSqm"] == round(750000 / 45.5)  # Should be 16484

def test_parse_offers_with_missing_district():
    """Test that district defaults to 'unknown' when missing"""
    scraper = OtodomScraper()
    
    # Create a test offer with missing district
    test_offer = {
        "areaInM2": 50.0,
        "price": 600000,
        "pricePerSqm": 12000,
        "floorNumber": 2,
        "location": {
            "city": "Warszawa"
            # district is missing
        }
    }
    
    result = scraper.parse_offer_json(test_offer)
    
    # Check that district defaults to "unknown"
    assert result["district"] == "unknown"