"""
Main scraper module with the OtodomScraper class to orchestrate the scraping process
"""
import json
import logging
import re
import time
import traceback
from bs4 import BeautifulSoup
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional, Callable

# Import from our modular components
from .offer_parser import parse_offer_json
from .filters import should_skip_offer
from .storage import insert_listing, clear_listings
from .pagination import should_continue_pagination

# Import database setup function
from ..db import setup_database

# Constants
CITIES = ["warszawa", "krakow", "lodz", "wroclaw", "poznan", "gdansk", "szczecin", "bydgoszcz", "lublin", "bialystok"]


class OtodomScraper:
    def __init__(self, debug=False, city_filter=None, district_filter=None, district_mode="prefix",
                 room_filter=None, max_pages=None, preserve=False, days_filter=1):
        """
        Initialize the OtodomScraper
        
        Args:
            debug: Whether to save debug information
            city_filter: List of cities to scrape, or None for all
            district_filter: List of districts to match, or None/["all"] for all
            district_mode: Mode for district matching, "exact" or "prefix"
            room_filter: List of room numbers to filter by
            max_pages: Maximum number of pages to scrape per city/district
            preserve: Whether to preserve existing listings in database
            days_filter: Only scrape listings from the last X days
        """
        self.debug = debug
        self.preserve = preserve
        # Define debug directory relative to script location
        self.debug_dir = Path(__file__).parent.parent / "debug"
        self.debug_dir.mkdir(exist_ok=True)
        self.status = "Ready"
        self.progress = 0
        self.error_occurred = False
        self.days_filter = days_filter
        # Initialize max_filtered_pages dictionary to store pagination info per city/district
        self.max_filtered_pages = {}
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        self.base_url = "https://www.otodom.pl/pl/oferty/sprzedaz/mieszkanie"
        self.districts_cache = {}
        self.city_filter = city_filter
        self.district_filter = district_filter if district_filter else ["all"]
        self.district_mode = district_mode.lower()  # "exact" or "prefix"
        self.room_filter = room_filter
        self.max_pages = max_pages
        setup_database()

    def get_districts(self, city):
        """Get list of districts for a city"""
        if city in self.districts_cache:
            return self.districts_cache[city]
        
        # For now, just return empty string to scrape the whole city
        # This can be enhanced in the future to fetch actual districts
        self.districts_cache[city] = [""]
        return self.districts_cache[city]

    def _make_request(self, url, max_retries=3):
        """Make HTTP request with retry logic"""
        import requests
        
        retry_delays = [2, 4, 8]  # Backoff strategy
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=self.headers, timeout=10)
                if response.status_code == 200:
                    return response
                
                logging.warning(f"Request to {url} failed with status code {response.status_code}, attempt {attempt+1}/{max_retries}")
                
                if attempt < max_retries - 1:
                    time.sleep(retry_delays[attempt])
            except Exception as e:
                logging.warning(f"Request to {url} failed: {str(e)}, attempt {attempt+1}/{max_retries}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delays[attempt])
        
        logging.error(f"Failed to retrieve {url} after {max_retries} attempts")
        self.error_occurred = True
        return None

    def extract_offers(self, next_json: dict, city=None, page=None, soup=None) -> list[dict]:
        """Extract listing offers from JSON data"""
        try:
            # Strategy 1: Try extracting from adSearchResult.searchAds.items
            if ("props" in next_json and 
                "pageProps" in next_json["props"] and 
                "adSearchResult" in next_json["props"]["pageProps"] and 
                "searchAds" in next_json["props"]["pageProps"]["adSearchResult"] and
                "items" in next_json["props"]["pageProps"]["adSearchResult"]["searchAds"]):
                
                return next_json["props"]["pageProps"]["adSearchResult"]["searchAds"]["items"]
                
            # Strategy 2: Try extracting from __NEXT_DATA__ with different structure
            if ("props" in next_json and 
                "pageProps" in next_json["props"] and 
                "data" in next_json["props"]["pageProps"] and 
                "searchAds" in next_json["props"]["pageProps"]["data"] and
                "items" in next_json["props"]["pageProps"]["data"]["searchAds"]):
                
                return next_json["props"]["pageProps"]["data"]["searchAds"]["items"]
            
            # Strategy 3: Legacy OtoDom site format with embedded JS object
            if soup:
                data_container_script = None
                
                # Look for script with window.__INITIAL_STATE__
                for script in soup.find_all("script"):
                    if script.string and "window.__INITIAL_STATE__" in script.string:
                        data_container_script = script
                        break
                
                if data_container_script:
                    try:
                        # Extract JSON part from the JS code
                        js_text = data_container_script.string
                        json_start = js_text.find('{')
                        json_end = js_text.rfind('}') + 1
                        json_text = js_text[json_start:json_end]
                        
                        data = json.loads(json_text)
                        
                        if "listing" in data and "ads" in data["listing"]:
                            return data["listing"]["ads"]
                    except Exception as e:
                        logging.error(f"Failed to extract from window.__INITIAL_STATE__: {str(e)}")
            
            # No valid data structure found
            logging.warning("Could not extract offers from JSON data - unknown structure")
            return []
            
        except Exception as e:
            logging.error(f"Failed to extract offers from JSON: {str(e)}")
            return []

    def scrape_page(self, city, district, page=1):
        """Scrape a single page of listings"""
        url_path = f"{self.base_url}/{city}"
        if district:
            url_path += f"/{district}"
        
        # Start with base query parameters
        params = [f"page={page}", "viewType=list", f"daysSinceCreated={self.days_filter}"]
        
        # Add room filter parameters if specified
        if self.room_filter:
            room_params = ",".join(str(room) for room in self.room_filter)
            params.append(f"roomsNumber=%5B{room_params}%5D")
            
        # Join all parameters
        url = f"{url_path}?{'&'.join(params)}"
        
        logging.debug(f"Requesting page {page} with filter URL: {url}")
        response = self._make_request(url)
        if not response:
            return False, None
        
        # Check if we were redirected and log the final URL
        final_url = response.url
        if url != final_url:
            logging.warning(f"URL was redirected: {url} -> {final_url}")
            # Ensure daysSinceCreated parameter is still present in the final URL
            if f"daysSinceCreated={self.days_filter}" not in final_url:
                logging.error(f"Critical: daysSinceCreated filter was lost in redirect for page {page}!")
                # Re-add the days filter parameter if it's missing
                if "?" in final_url:
                    final_url = f"{final_url}&daysSinceCreated={self.days_filter}"
                else:
                    final_url = f"{final_url}?daysSinceCreated={self.days_filter}"
                # Make a new request with the corrected URL
                logging.debug(f"Retrying with corrected URL: {final_url}")
                response = self._make_request(final_url)
                if not response:
                    return False, None
        
        logging.debug(f"GET {response.url} -> {response.status_code} {len(response.content)}B")
        
        # Parse HTML to find the JSON data
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the __NEXT_DATA__ script tag containing JSON data
        data_script = soup.find("script", id="__NEXT_DATA__")
        
        # Save response for offline analysis when in debug mode
        if self.debug:
            dump_file = self.debug_dir / f"{city}_{district}_{page}.html"
            dump_file.write_bytes(response.content)
            logging.debug(f"Saved raw page → {dump_file}")
        
        if not data_script:
            logging.warning(f"No __NEXT_DATA__ found for {city}/{district} page {page}")
            return False, 0
        
        try:
            # Parse the JSON data
            data = json.loads(data_script.string)
            
            # On page 1, extract pagination information from meta description
            if page == 1:
                html_text = str(soup)
                # Extract the total number of listings from meta description
                meta_match = re.search(r'Zobacz (\d+) ogłoszeń', html_text)
                if meta_match:
                    import math
                    total_listings = int(meta_match.group(1))
                    total_pages = math.ceil(total_listings / 36)  # 36 listings per page
                    self.max_filtered_pages[f"{city}-{district}"] = total_pages
                    logging.debug(f"Found total listings for {city}-{district}: {total_listings}, calculated {total_pages} pages")
                else:
                    # Fallback to the old method if meta description not found
                    pagination_match = re.findall(r'class="pagination__page"[^>]*>(\d+)<', html_text)
                    if pagination_match:
                        max_page = max(map(int, pagination_match))
                        self.max_filtered_pages[f"{city}-{district}"] = max_page
                        logging.debug(f"Fallback: Found max page for {city}-{district}: {max_page}")
            
            # Extract offers list using helper function that handles different JSON structures
            offers = self.extract_offers(data, city=city, page=page, soup=soup)
            
            logging.debug(f"offers_found={len(offers)}")
            
            if self.debug and offers:
                # Save JSON for debugging
                json_dump_file = self.debug_dir / f"{city}_{district}_{page}_data.json"
                with open(json_dump_file, 'w', encoding='utf-8') as f:
                    json.dump(offers, f, indent=2, ensure_ascii=False)
                logging.debug(f"Saved JSON data → {json_dump_file}")
            
            if not offers:
                logging.warning(f"No offers found in JSON for {city}/{district} page {page}")
                return False, 0
            
            inserted_rows = 0
            # Process each offer in the offers list
            for offer in offers:
                # Parse the offer to get structured data
                listing_data = parse_offer_json(offer)
                if listing_data:
                    # Check if we should skip this offer based on filters
                    if should_skip_offer(listing_data, self.district_filter, self.district_mode):
                        continue
                    
                    area = listing_data['area']
                    price_sqm = listing_data['price_per_sqm']
                    floor = listing_data['floor']
                    rooms = listing_data['rooms']
                    
                    # Skip incomplete offers
                    if not all((area, price_sqm)):  # Floor can be 0
                        logging.warning("Missing required field - skipping")
                        continue
                    
                    # Use district values from parsed data, not from URL parameters
                    district_sub = listing_data['district']  
                    district_parent = listing_data['district_parent']
                    if insert_listing(
                        city=city, 
                        district=district_sub, 
                        district_parent=district_parent, 
                        area=area, 
                        price_per_sqm=price_sqm, 
                        floor=floor, 
                        rooms=rooms
                    ):
                        inserted_rows += 1
            
            if inserted_rows > 0:
                logging.info(f"Inserted {inserted_rows} rows on page {page}")
            
            # Determine if we should continue to the next page
            has_next_page = should_continue_pagination(city, district, page, inserted_rows, self.max_filtered_pages)
            
            return has_next_page, len(offers)
            
        except (json.JSONDecodeError, KeyError) as e:
            logging.error(f"Failed to parse JSON data: {str(e)}")
            logging.error(traceback.format_exc())
            self.error_occurred = True
            return False, 0

    def start_scraping(self, callback=None):
        """Start the scraping process for all cities and districts"""
        try:
            # Clear existing listings if preserve flag is not set
            if not self.preserve:
                clear_listings()
            
            # Filter cities if city_filter is specified
            cities_to_scrape = [city for city in CITIES if self.city_filter is None or city.lower() in [c.lower() for c in self.city_filter]]
            
            if self.city_filter and not cities_to_scrape:
                logging.warning(f"None of the specified cities {self.city_filter} match available cities. Using all cities.")
                cities_to_scrape = CITIES
            
            total_cities = len(cities_to_scrape)
            
            for city_idx, city in enumerate(cities_to_scrape):
                logging.info(f"Starting scrape for city: {city}")
                self.status = f"Starting {city}"
                self.progress = (city_idx / total_cities) * 100
                
                if callback:
                    callback(self.status, self.progress, self.error_occurred)
                
                districts = self.get_districts(city)
                
                for district_idx, district in enumerate(districts):
                    district_name = district if district else "all districts"
                    logging.info(f"Scraping {city} - {district_name}")
                    
                    page = 1
                    has_next_page = True
                    
                    while has_next_page:
                        self.status = f"{city} - {district_name} p{page}"
                        total_progress = ((city_idx + (district_idx / len(districts))) / total_cities) * 100
                        self.progress = total_progress
                        
                        if callback:
                            callback(self.status, self.progress, self.error_occurred)
                        
                        logging.info(f"Scraping {city} - {district_name} - page {page}")
                        has_next_page, listing_count = self.scrape_page(city, district, page)
                        
                        if not has_next_page:
                            if page == 1:
                                logging.info(f"No listings inserted for {city} - {district_name}, skipping")
                            break
                        
                        page += 1
                        
                        # Stop pagination if max_pages is set
                        if self.max_pages and page > self.max_pages:
                            logging.info(f"Reached max pages ({self.max_pages}) for {city} - {district_name}")
                            break
                            
                        time.sleep(1.5)  # Sleep between pages to avoid rate limiting
                
                logging.info(f"Finished scraping {city}")
            
            self.status = "Completed" if not self.error_occurred else "Completed with errors - see log"
            self.progress = 100
            
            if callback:
                callback(self.status, self.progress, self.error_occurred)
            
            logging.info("Scraping process completed")
            return True
        
        except Exception as e:
            logging.error(f"Scraping process failed: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            self.error_occurred = True
            self.status = "Failed - see log"
            
            if callback:
                callback(self.status, self.progress, self.error_occurred)
            
            return False