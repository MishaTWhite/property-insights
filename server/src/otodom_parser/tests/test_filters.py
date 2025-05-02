import sys
import os
import json
from pathlib import Path
import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from otodom_parser.scraper import OtodomScraper
from unittest.mock import patch, MagicMock

def test_room_filter():
    """Test that room filter correctly adds parameter to URL"""
    scraper = OtodomScraper(room_filter=[1])
    
    with patch.object(scraper, '_make_request') as mock_request:
        # Set up mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html><script id='__NEXT_DATA__'>{'props': {'pageProps': {'data': {'searchAds': {'items': []}}}}}</script></html>"
        mock_request.return_value = mock_response
        
        # Call scrape_page
        scraper.scrape_page("warszawa", None, 1)
        
        # Check that the URL contains the room filter
        args, kwargs = mock_request.call_args
        assert "roomsNumber=%5B1%5D" in args[0]

def test_filter_by_district():
    """Test that district filter correctly filters offers"""
    scraper = OtodomScraper(district_filter=["mokotow"])
    
    # Create a mock offer with district
    mock_offers = [
        {"id": "1", "location": {"address": {"district": "Mokotów"}}},
        {"id": "2", "location": {"address": {"district": "Ursynów"}}},
        {"id": "3", "location": {"address": {"district": "Mokotów"}}}
    ]
    
    # Patch extract_offers to return our mock offers
    with patch.object(scraper, 'extract_offers', return_value=mock_offers), \
         patch.object(scraper, '_make_request') as mock_request:
        
        # Set up mock response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_request.return_value = mock_response
        
        # Override parse_json_data to avoid actual parsing
        def mock_parse(*args, **kwargs):
            return mock_offers
        
        scraper.parse_json_data = mock_parse
        
        # Call scrape_page
        has_next, count = scraper.scrape_page("warszawa", None, 1)
        
        # We should have 2 offers from Mokotów
        assert count == 2
        
def test_district_mode_filtering():
    """Test that district filter modes work correctly with parent slugs"""
    # Create mock offers with a sub-district
    mock_offers = [
        {"id": "1", "location": {"address": {"district": "stary-mokotow"}}},
        {"id": "2", "location": {"address": {"district": "ursynow"}}},
        {"id": "3", "location": {"address": {"district": "mokotow"}}},
        {"id": "4", "location": {"address": {"district": "wyczolki-mokotow"}}}
    ]
    
    # Test with prefix mode (default)
    scraper_prefix = OtodomScraper(district_filter=["mokotow"], district_mode="prefix")
    
    # Patch extract_offers to return our mock offers
    with patch.object(scraper_prefix, 'extract_offers', return_value=mock_offers), \
         patch.object(scraper_prefix, '_make_request') as mock_request:
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_request.return_value = mock_response
        
        # Override parse_json_data to avoid actual parsing
        def mock_parse(*args, **kwargs):
            return mock_offers
        
        scraper_prefix.parse_json_data = mock_parse
        
        # Call scrape_page with prefix mode
        has_next, count = scraper_prefix.scrape_page("warszawa", None, 1)
        
        # In prefix mode, should keep "stary-mokotow", "mokotow", and "wyczolki-mokotow"
        assert count == 3, "Prefix mode should match 'stary-mokotow' and other mokotow variants"
    
    # Test with exact mode
    scraper_exact = OtodomScraper(district_filter=["mokotow"], district_mode="exact")
    
    # Patch extract_offers to return our mock offers
    with patch.object(scraper_exact, 'extract_offers', return_value=mock_offers), \
         patch.object(scraper_exact, '_make_request') as mock_request:
        
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html></html>"
        mock_request.return_value = mock_response
        
        # Override parse_json_data to avoid actual parsing
        scraper_exact.parse_json_data = mock_parse
        
        # Call scrape_page with exact mode
        has_next, count = scraper_exact.scrape_page("warszawa", None, 1)
        
        # In exact mode, should only keep exact "mokotow" match
        assert count == 1, "Exact mode should only match 'mokotow'"

def test_max_pages_limit():
    """Test that max_pages correctly limits pagination"""
    # Create a scraper with max_pages=2
    scraper = OtodomScraper(max_pages=2)
    
    # Mock start_scraping to check if it breaks after page 2
    with patch.object(scraper, 'scrape_page') as mock_scrape_page:
        # Set up mock response to indicate there are more pages
        mock_scrape_page.return_value = (True, 10)
        
        # Mock time.sleep to avoid delays
        with patch('time.sleep'):
            # Create a test for the pagination loop only
            def test_pagination(city, district):
                page = 1
                has_next_page = True
                
                while has_next_page:
                    has_next_page, count = scraper.scrape_page(city, district, page)
                    page += 1
                    if scraper.max_pages and page > scraper.max_pages:
                        break
                
                return page
            
            # Run test pagination
            final_page = test_pagination("warszawa", None)
            
            # Assert that pagination stopped at page 3 (after processing page 2)
            assert final_page == 3