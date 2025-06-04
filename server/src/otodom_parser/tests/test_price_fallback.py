import sys
import os
import unittest
import logging

# Add the parent directory to the path to import the scraper module
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scraper import OtodomScraper

class TestPriceFallback(unittest.TestCase):
    def setUp(self):
        # Initialize the scraper with debug mode
        self.scraper = OtodomScraper(debug=True)
        
    def test_price_from_per_square_meter_fallback(self):
        """Test that priceFromPerSquareMeter is used when other price data is null"""
        
        # Test fixture as specified in the problem statement
        offer = {
            "pricePerSquareMeter": None,
            "totalPrice": None,
            "areaInSquareMeters": 50,  # Need a non-zero area or the offer will be skipped
            "priceFromPerSquareMeter": {"value": 18120, "currency": "PLN"},
            "location": {"reverseGeocoding": {"locations": []}},
            "id": "test_offer"  # Add ID for logging purposes
        }
        
        # Parse the offer
        result = self.scraper.parse_offer_json(offer)
        
        # Assert that the price_per_sqm is correctly extracted from priceFromPerSquareMeter
        self.assertIsNotNone(result)
        self.assertEqual(result["price_per_sqm"], 18120)

if __name__ == "__main__":
    # Configure logging for testing
    logging.basicConfig(level=logging.DEBUG)
    unittest.main()