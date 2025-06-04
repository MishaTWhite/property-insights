import unittest
import sys
import os
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from otodom_parser.scraper import OtodomScraper

class TestDistrictFiltering(unittest.TestCase):
    def setUp(self):
        # Create a scraper instance with debug mode and specific district filter
        self.scraper = OtodomScraper(debug=True, district_filter=["mokotow"], district_mode="prefix")
        
    def test_parse_offer_json_district_extraction(self):
        """Test that parse_offer_json correctly extracts district_parent and district"""
        # Create a mock offer with nested district path
        mock_offer = {
            "areaInSquareMeters": 50.0,
            "totalPrice": {"value": 500000},
            "floorNumber": "SECOND",
            "location": {
                "address": {
                    "city": "warszawa"
                },
                "reverseGeocoding": {
                    "locations": [
                        {"id": "poland/mazowieckie/warszawa/mokotow/stary-mokotow"}
                    ]
                }
            }
        }
        
        # Parse the offer
        result = self.scraper.parse_offer_json(mock_offer)
        
        # Verify district_sub and district_parent were extracted correctly
        self.assertEqual(result["district"], "stary-mokotow")
        self.assertEqual(result["district_parent"], "mokotow")
        
    def test_district_filter_with_parent(self):
        """Test that district filtering works with parent district"""
        # Create a mock offer where the filter should match the parent district
        mock_offer = {
            "areaInSquareMeters": 50.0,
            "totalPrice": {"value": 500000},
            "floorNumber": "SECOND",
            "location": {
                "address": {
                    "city": "warszawa"
                },
                "reverseGeocoding": {
                    "locations": [
                        {"id": "poland/mazowieckie/warszawa/mokotow/stary-mokotow"}
                    ]
                }
            }
        }
        
        # Test district filtering manually
        parsed_data = self.scraper.parse_offer_json(mock_offer)
        district = parsed_data.get('district', '').lower()
        district_parent = parsed_data.get('district_parent', '').lower()
        
        # Check if the filter matches using prefix mode
        match_found = False
        for d in self.scraper.district_filter:
            d_lower = d.lower()
            if (district.startswith(d_lower) or 
                f"-{d_lower}" in district or
                district_parent.startswith(d_lower) or
                f"-{d_lower}" in district_parent):
                match_found = True
                break
        
        # The filter is "mokotow" which should match "mokotow" in district_parent
        self.assertTrue(match_found)

    def test_extract_offer_with_district_filter(self):
        """Test that extract_offers correctly applies district filtering"""
        # Create a mock next_json with offers
        mock_next_json = {
            "searchAds": {
                "items": [
                    # This offer should match (mokotow is the parent)
                    {
                        "id": "offer1",
                        "areaInSquareMeters": 50.0,
                        "totalPrice": {"value": 500000},
                        "floorNumber": "SECOND",
                        "location": {
                            "address": {"city": "warszawa"},
                            "reverseGeocoding": {
                                "locations": [
                                    {"id": "poland/mazowieckie/warszawa/mokotow/stary-mokotow"}
                                ]
                            }
                        }
                    },
                    # This offer should NOT match (different district)
                    {
                        "id": "offer2",
                        "areaInSquareMeters": 60.0,
                        "totalPrice": {"value": 600000},
                        "floorNumber": "FIRST",
                        "location": {
                            "address": {"city": "warszawa"},
                            "reverseGeocoding": {
                                "locations": [
                                    {"id": "poland/mazowieckie/warszawa/wola/czyste"}
                                ]
                            }
                        }
                    }
                ]
            }
        }
        
        # Create a new scraper with mokotow filter
        filter_scraper = OtodomScraper(debug=True, district_filter=["mokotow"], district_mode="prefix")
        
        # Extract offers (this should apply the filter)
        offers = filter_scraper.extract_offers(mock_next_json)
        
        # We should have only one offer (the mokotow one)
        self.assertEqual(len(offers), 1)
        self.assertEqual(offers[0]["id"], "offer1")

if __name__ == "__main__":
    unittest.main()