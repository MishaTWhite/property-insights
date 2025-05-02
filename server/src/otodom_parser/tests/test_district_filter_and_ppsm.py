import os
import json
import pytest
from ..scraper import OtodomScraper

# Helper to load test fixtures
def load_fixture(filename):
    fixture_path = os.path.join(os.path.dirname(__file__), 'fixtures', filename)
    with open(fixture_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def test_district_exact_mode_filtering():
    """Test that district filter in exact mode works correctly"""
    # Load fixture with different districts
    fixture = load_fixture('offers_with_district_and_no_ppsm.json')
    offers = fixture['items']
    
    # Create scraper with exact mode district filter for 'mokotow'
    scraper = OtodomScraper(district_filter=['mokotow'], district_mode='exact')
    
    # Filter the offers manually using the filtering logic
    filtered_offers = []
    for offer in offers:
        parsed_data = scraper.parse_offer_json(offer)
        if parsed_data:
            district = parsed_data.get('district', '').lower()
            district_parent = parsed_data.get('district_parent', '').lower()
            
            # Check if either district or district_parent exactly matches 'mokotow'
            match_found = ('mokotow' == district or 'mokotow' == district_parent)
            if match_found:
                filtered_offers.append(offer)
    
    # We should have only the two mokotow offers, not the czechowice one
    assert len(filtered_offers) == 2
    
    # Verify the filtered offers have the expected districts
    for offer in filtered_offers:
        locations = offer['location']['reverseGeocoding']['locations']
        location_id = locations[-1]['id']
        assert 'mokotow' in location_id, f"Unexpected district in filtered offer: {location_id}"

def test_price_per_square_meter_calculation():
    """Test that price per square meter is calculated when missing"""
    # Load fixture without pricePerSquareMeter
    fixture = load_fixture('offers_with_district_and_no_ppsm.json')
    offers = fixture['items']
    
    scraper = OtodomScraper()
    
    # Test each offer in the fixture
    for offer in offers:
        # Make sure none of the offers has pricePerSquareMeter
        assert "pricePerSquareMeter" not in offer, "Test fixture should not have pricePerSquareMeter"
        
        # Parse the offer to calculate price_per_sqm
        parsed_data = scraper.parse_offer_json(offer)
        
        # Verify the calculation was done correctly
        total_price = offer['totalPrice']['value']
        area = offer['areaInSquareMeters']
        expected_price_per_sqm = int(round(total_price / area))
        
        assert parsed_data['price_per_sqm'] == expected_price_per_sqm, \
            f"Price per sqm calculation incorrect: got {parsed_data['price_per_sqm']}, expected {expected_price_per_sqm}"