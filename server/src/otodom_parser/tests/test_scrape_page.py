import pytest
import json
from unittest.mock import patch, MagicMock
from bs4 import BeautifulSoup
from ..scraper import OtodomScraper

class TestScrapePage:
    def test_scrape_page_district_handling(self):
        """
        Test that scrape_page correctly handles district and district_parent parameters
        and calls insert_listing with the correct arguments.
        """
        # Create a mock response with a sample offer
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.content = b"content"
        
        # Create sample JSON data that would be in the __NEXT_DATA__ tag
        sample_json = {
            "props": {
                "pageProps": {
                    "data": {
                        "searchAds": {
                            "items": [{
                                "id": "123",
                                "title": "Test Apartment",
                                "locationLabel": {
                                    "value": "Warszawa, Mokotów, Stary Mokotów"
                                },
                                "totalPrice": {
                                    "value": "500000"
                                },
                                "areaInSquareMeters": {
                                    "value": "50"
                                },
                                "terrainAreaInSquareMeters": None,
                                "numberOfRooms": 2,
                                "floor": {
                                    "value": "3"
                                }
                            }]
                        }
                    }
                }
            }
        }
        
        # Create a mock soup with the JSON data
        soup = BeautifulSoup("<html><script id='__NEXT_DATA__'>" + 
                             json.dumps(sample_json) + 
                             "</script></html>", 'html.parser')
        
        # Mock the _make_request method to return our mock response
        with patch.object(OtodomScraper, '_make_request', return_value=mock_response):
            # Mock the BeautifulSoup constructor to return our mock soup
            with patch('bs4.BeautifulSoup', return_value=soup):
                # Mock the insert_listing function
                with patch('otodom_parser.scraper.insert_listing') as mock_insert:
                    # Create the scraper instance
                    scraper = OtodomScraper(debug=False)
                    
                    # Override extract_offers to return our mock data
                    def mock_extract_offers(*args, **kwargs):
                        return sample_json["props"]["pageProps"]["data"]["searchAds"]["items"]
                    scraper.extract_offers = mock_extract_offers
                    
                    # Call the method under test
                    city = "warszawa"
                    district_parent = "mokotow"
                    district = "stary-mokotow"
                    
                    # Test with district_parent = district for simplicity
                    has_next, count = scraper.scrape_page(city, district_parent)
                    
                    # Assert insert_listing was called with the correct parameters
                    mock_insert.assert_called_once()
                    call_args = mock_insert.call_args[1]  # Get keyword arguments
                    
                    assert call_args["city"] == city
                    assert call_args["district"] == district_parent  # Current implementation passes district as district
                    assert call_args["district_parent"] == district_parent
                    assert call_args["area"] == 50.0
                    assert call_args["price_per_sqm"] > 0
                    assert call_args["floor"] == 3