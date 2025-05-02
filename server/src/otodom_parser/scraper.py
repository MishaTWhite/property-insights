import requests
import logging
import time
import re
import json
import sys
import traceback
from pathlib import Path
from bs4 import BeautifulSoup
from .db import insert_listing, clear_listings, setup_database

# Configure logging
logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("parser_errors.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ])

# Define cities to scrape
CITIES = [
    "warszawa", "krakow", "wroclaw", "gdansk", 
    "poznan", "lodz", "katowice", "szczecin"
]

class OtodomScraper:
    def __init__(self, debug=False, city_filter=None, district_filter=None, district_mode="prefix", room_filter=None, max_pages=None):
        self.debug = debug
        # Define debug directory relative to script location
        self.debug_dir = Path(__file__).parent / "debug"
        self.debug_dir.mkdir(exist_ok=True)
        self.status = "Ready"
        self.progress = 0
        self.error_occurred = False
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
        """Retrieve district slugs for a given city"""
        try:
            # Check if districts are already cached
            if city in self.districts_cache:
                return self.districts_cache[city]
            
            url = f"{self.base_url}/{city}"
            response = self._make_request(url)
            
            if response:
                soup = BeautifulSoup(response.text, 'html.parser')
                districts = []
                
                # Look for district links - this is a simplified example
                # In a real implementation, you would need to adapt this based on the actual HTML structure
                district_elements = soup.select('a[href*="/district-"]')
                
                for element in district_elements:
                    href = element.get('href', '')
                    district_match = re.search(r'/district-([^/]+)', href)
                    if district_match:
                        district = district_match.group(1)
                        districts.append(district)
                
                # If no districts found, fallback to empty list (will scrape the whole city)
                self.districts_cache[city] = districts or [""]
                return self.districts_cache[city]
            
            return [""]  # Fallback to no district
        except Exception as e:
            logging.error(f"Failed to get districts for {city}: {str(e)}")
            logging.error(f"Traceback: {logging.traceback.format_exc()}")
            self.error_occurred = True
            return [""]  # Fallback to no district

    def _make_request(self, url, max_retries=3):
        """Make HTTP request with retry logic"""
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

    def to_float(self, v):
        """Convert a value to float, handling None values and formatting Polish number strings
        
        Args:
            v: The value to convert, can be None, string, or number
            
        Returns:
            float value or None if conversion fails
        """
        try:
            if v is None:
                return None
            if isinstance(v, str):
                v = v.replace(' ', '').replace(',', '.')
                match = re.search(r'[\d.]+', v)
                if match:
                    return float(match[0])
                return None
            return float(v)
        except (TypeError, ValueError):
            return None
        
    def extract_offers(self, next_json: dict, city=None, page=None, soup=None) -> list[dict]:
        """Extract offers from different possible JSON paths in the Next.js data structure
        
        Args:
            next_json: The JSON data from __NEXT_DATA__
            city: The city being scraped (for error reporting)
            page: The page number being scraped (for error reporting)
            soup: Optional BeautifulSoup object to extract JSON-LD data as fallback
            
        Returns:
            List of offer dictionaries
            
        Raises:
            ValueError: If no offers are found in any known paths
        """
        errors = []
        
        # Legacy paths to check as fallbacks
        legacy_paths = [
            ["props", "pageProps", "initialState", "listingSearch", "offers"],
        ]
        
        # Try the direct data path approach first (newest format)
        try:
            items = (next_json.get("props", {})
                    .get("pageProps", {})
                    .get("data", {})
                    .get("searchAds", {})
                    .get("items"))
            if isinstance(items, list) and items:
                logging.info(f"Found offers using props.pageProps.data.searchAds.items path")
                return items
        except (KeyError, TypeError, AttributeError) as e:
            errors.append(f"Direct data path approach failed: {str(e)}")
        
        # Next try the dynamic query approach
        try:
            queries = next_json.get("props", {}).get("pageProps", {}).get("dehydratedState", {}).get("queries", [])
            for query in queries:
                # Try with "offers" field first (older format)
                offers = (query.get("state", {})
                        .get("data", {})
                        .get("searchAds", {})
                        .get("offers"))
                if isinstance(offers, list) and offers:
                    logging.info(f"Found offers using searchAds.offers path")
                    return offers
                
                # Try with "items" field next (newer format)
                items = (query.get("state", {})
                        .get("data", {})
                        .get("searchAds", {})
                        .get("items"))
                if isinstance(items, list) and items:
                    logging.info(f"Found offers using searchAds.items path")
                    return items
                
                # Try with "results" field last (another format)
                results = (query.get("state", {})
                         .get("data", {})
                         .get("searchAds", {})
                         .get("results"))
                if isinstance(results, list) and results:
                    logging.info(f"Found offers using searchAds.results path")
                    return results
        except (KeyError, IndexError, TypeError, AttributeError) as e:
            errors.append(f"Dynamic query approach failed: {str(e)}")
            
        # Try legacy paths as fallback
        for p in legacy_paths:
            cur = next_json
            try:
                for k in p:
                    cur = cur[k]
                if isinstance(cur, list) and cur:
                    logging.info(f"Found offers using legacy path: {' > '.join(p)}")
                    return cur
            except (KeyError, IndexError, TypeError) as e:
                errors.append(f"Legacy path {' > '.join(p)} failed: {str(e)}")
                continue
            
        # Try using JSON-LD as last resort if soup is provided
        if soup:
            try:
                import json
                # Find JSON-LD script tags in the HTML
                json_ld_tags = soup.find_all("script", {"type": "application/ld+json"})
                
                for tag in json_ld_tags:
                    try:
                        ld_data = json.loads(tag.string)
                        # Check if this is the AggregateOffer we're looking for
                        if isinstance(ld_data, dict) and ld_data.get("@type") == "AggregateOffer":
                            offers = ld_data.get("offers", [])
                            if offers and isinstance(offers, list):
                                logging.info(f"Found offers using JSON-LD AggregateOffer")
                                return offers
                        
                        # Check for Product type with offers
                        if isinstance(ld_data, dict) and ld_data.get("@type") == "Product" and "offers" in ld_data:
                            # Convert JSON-LD offers to the expected format
                            offers = ld_data.get("offers", [])
                            if offers and isinstance(offers, list):
                                logging.info(f"Found offers using JSON-LD Product.offers")
                                processed_offers = []
                                for offer in offers:
                                    # Extract required data
                                    try:
                                        price = int(offer.get("price", "0"))
                                        item = offer.get("itemOffered", {})
                                        floor_size = item.get("floorSize", {})
                                        area = float(floor_size.get("value", 0))
                                        address = item.get("address", {})
                                        city = address.get("addressLocality", "")
                                        
                                        processed_offer = {
                                            "price": price,
                                            "areaInM2": area,
                                            # JSON-LD doesn't have floor info
                                            "floorNumber": 0,
                                            "location": {
                                                "city": city,
                                                # District is not available in JSON-LD
                                                "district": "unknown"
                                            }
                                        }
                                        # Calculate price_per_sqm if not directly available
                                        if area > 0:
                                            processed_offer["pricePerSqm"] = round(price / area)
                                        
                                        processed_offers.append(processed_offer)
                                    except Exception as e:
                                        logging.debug(f"Failed to process JSON-LD offer: {str(e)}")
                                        continue
                                
                                if processed_offers:
                                    return processed_offers
                    except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
                        errors.append(f"JSON-LD parsing error: {str(e)}")
                        continue
            except Exception as e:
                # If any unexpected error occurs during JSON-LD parsing, continue to the error message
                errors.append(f"JSON-LD extraction error: {str(e)}")
                
        # If no offers found in the JSON data, raise ValueError with helpful message
        dump_file = f"debug/{city}_{page}.html" if city and page else "unknown_dump.html"
        error_location = f" for {city} page {page}" if city and page else ""
        error_msg = f"No offers found{error_location} – saved to {dump_file}"
        
        if errors and self.debug:
            error_msg += f"\nErrors encountered: {'; '.join(errors)}"
            
        raise ValueError(error_msg)
            
    def safe_lower(self, x, default="unknown"):
        """Safely convert a string or dict with name/label/value/fullName key to lowercase
        
        Args:
            x: The value to convert, can be a string or dict
            default: Default value to return if conversion isn't possible
            
        Returns:
            Lowercase string or default value
        """
        if isinstance(x, str):
            return x.lower()
        if isinstance(x, dict):
            for k in ("name", "label", "value", "fullName"):
                if k in x and isinstance(x[k], str):
                    return x[k].lower()
        return default

    def parse_offer_json(self, offer):
        """Extract information from a JSON offer object"""
        try:
            logging.debug("Parsing offer JSON...")
            
            # Extract area from JSON
            area = self.to_float(offer.get("areaInSquareMeters"))
            if area is None:
                area = self.to_float(offer.get("areaInM2"))
                
            if area is not None:
                logging.debug(f"Found area: {area}")
            else:
                logging.debug(f"Skipped offer {offer.get('id', 'unknown')} (area=None)")
                return None
            
            # Extract price per sqm from JSON or calculate if missing
            ppsm = self.to_float(offer.get("pricePerSquareMeter", {}).get("value"))
            if ppsm is not None:
                price_per_sqm = int(ppsm)
                logging.debug(f"Found price per sqm (pricePerSquareMeter.value): {price_per_sqm}")
            elif "pricePerSqm" in offer:
                price_per_sqm = self.to_float(offer["pricePerSqm"])
                if price_per_sqm is not None:
                    price_per_sqm = int(price_per_sqm)
                    logging.debug(f"Found price per sqm (pricePerSqm): {price_per_sqm}")
            else:
                # Try to calculate price per sqm from total price if available
                total = self.to_float(offer.get("totalPrice", {}).get("value"))
                if total is None:
                    total = self.to_float(offer.get("price"))
                    
                price_per_sqm = int(total / area) if total else None
                if price_per_sqm is not None:
                    logging.debug(f"Calculated price per sqm from price: {price_per_sqm}")
                else:
                    logging.debug("Price per sqm not found and could not be calculated")
            
            # Skip offers with missing price_per_sqm
            if price_per_sqm is None:
                logging.debug(f"Skipped offer {offer.get('id', 'unknown')} (area={area}, ppsm=None)")
                return None
            
            # Extract floor from JSON with support for string floor values
            floor_map = {
                "GROUND": 0, "FIRST": 1, "SECOND": 2, "THIRD": 3,
                "FOURTH": 4, "FIFTH": 5, "SIXTH": 6, "SEVENTH": 7,
                "ABOVE_TENTH": 11, "TENTH": 10, "NINTH": 9, "EIGHTH": 8
            }
            
            floor_number = offer.get("floorNumber")
            floor = floor_map.get(str(floor_number).upper(), 0) if floor_number else 0
            logging.debug(f"Mapped floorNumber '{floor_number}' to: {floor}")
            
            # Extract city and district from new format if available
            city = ""
            district_sub = "unknown"
            district_parent = "unknown"
            
            if ("location" in offer and 
                isinstance(offer["location"], dict) and
                "address" in offer["location"] and
                isinstance(offer["location"]["address"], dict) and
                "city" in offer["location"]["address"]):
                
                city_obj = offer["location"]["address"]["city"]
                city = self.safe_lower(city_obj)
                logging.debug(f"Found city from location.address.city: {city}")
                
                # Try to get district from reverseGeocoding locations
                if ("reverseGeocoding" in offer["location"] and
                    isinstance(offer["location"]["reverseGeocoding"], dict) and
                    "locations" in offer["location"]["reverseGeocoding"] and
                    isinstance(offer["location"]["reverseGeocoding"]["locations"], list) and
                    len(offer["location"]["reverseGeocoding"]["locations"]) > 0):
                    
                    locations = offer["location"]["reverseGeocoding"]["locations"]
                    path = locations[-1]["id"].split("/") if locations else []
                    district_sub = self.safe_lower(path[-1]) if path else "unknown"
                    district_parent = self.safe_lower(path[-2]) if len(path) >= 2 else district_sub
                    
                    logging.debug(f"Found district_sub from reverseGeocoding: {district_sub}")
                    logging.debug(f"Found district_parent from reverseGeocoding: {district_parent}")
            else:
                # Fall back to old format
                city = self.safe_lower(offer.get("location", {}).get("city", ""))
                district_sub = self.safe_lower(offer.get("location", {}).get("district", "")) or "unknown"
                district_parent = district_sub  # In old format, use the same value for both
                logging.debug(f"Using old format location data: city={city}, district_sub={district_sub}, district_parent={district_parent}")
            
            result = {
                'area': area,
                'price_per_sqm': price_per_sqm,
                'floor': floor,
                'city': city,
                'district': district_sub,
                'district_parent': district_parent
            }
            logging.debug(f"Parsed offer data: {result}")
            return result
        except Exception as e:
            logging.error(f"Failed to parse offer JSON: {str(e)}")
            logging.error(f"Traceback: {traceback.format_exc()}")
            self.error_occurred = True
            return None

    def scrape_page(self, city, district, page=1):
        """Scrape a single page of listings"""
        url_path = f"{self.base_url}/{city}"
        if district:
            url_path += f"/{district}"
        
        # Start with base query parameters
        params = [f"page={page}", "viewType=list"]
        
        # Add room filter parameters if specified
        if self.room_filter:
            room_params = ",".join(str(room) for room in self.room_filter)
            params.append(f"roomsNumber=%5B{room_params}%5D")
            
        # Join all parameters
        url = f"{url_path}?{'&'.join(params)}"
        
        logging.debug(f"Scraping URL: {url}")
        response = self._make_request(url)
        if not response:
            return False, None
        
        logging.debug(f"GET {url} -> {response.status_code} {len(response.content)}B")
        
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
            # Apply district filtering if specified and not "all"
            if self.district_filter and "all" not in self.district_filter:
                filtered_offers = []
                total_offers = len(offers)
                
                for offer in offers:
                    # Parse each offer to get district and district_parent
                    parsed_data = self.parse_offer_json(offer)
                    if parsed_data:
                        district = parsed_data.get('district', '').lower()
                        district_parent = parsed_data.get('district_parent', '').lower()
                        
                        match_found = False
                        
                        if self.district_mode == "exact":
                            # Exact mode - either district or district_parent must be an exact match
                            match_found = any(d.lower() == district or d.lower() == district_parent for d in self.district_filter)
                        else:  # prefix mode (default)
                            # Check if any filter is a prefix of either district or district_parent
                            for d in self.district_filter:
                                d_lower = d.lower()
                                if (district.startswith(d_lower) or 
                                    f"-{d_lower}" in district or
                                    district_parent.startswith(d_lower) or
                                    f"-{d_lower}" in district_parent):
                                    match_found = True
                                    break
                        
                        if match_found:
                            filtered_offers.append(offer)
                
                logging.debug(f"Kept {len(filtered_offers)}/{total_offers} offers after district filter")
                logging.debug(f"District filter kept {len(filtered_offers)}/{total_offers} offers")
                offers = filtered_offers
            
            for offer in offers:
                listing_data = self.parse_offer_json(offer)
                if listing_data:
                    area = listing_data['area']
                    price_sqm = listing_data['price_per_sqm']
                    floor = listing_data['floor']
                    
                    # Skip incomplete offers
                    if not all((area, price_sqm)):  # Floor can be 0
                        logging.warning("Missing required field - skipping")
                        continue
                    
                    insert_listing(city=city, district=district, district_parent=district, area=area, price_per_sqm=price_sqm, floor=floor)
                    inserted_rows += 1
            
            if inserted_rows > 0:
                logging.info(f"Inserted {inserted_rows} rows on page {page}")
            
            # Check if there are more pages
            has_next_page = len(offers) > 0
            
            return has_next_page, len(offers)
            
        except (json.JSONDecodeError, KeyError) as e:
            logging.error(f"Failed to parse JSON data: {str(e)}")
            logging.error(traceback.format_exc())
            self.error_occurred = True
            return False, 0

    def start_scraping(self, callback=None):
        """Start the scraping process for all cities and districts"""
        try:
            # Clear existing listings
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
                        
                        if listing_count is None or listing_count == 0:
                            if page == 1:
                                logging.info(f"No listings found for {city} - {district_name}, skipping")
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
            logging.error(f"Traceback: {logging.traceback.format_exc()}")
            self.error_occurred = True
            self.status = "Failed - see log"
            
            if callback:
                callback(self.status, self.progress, self.error_occurred)
            
            return False

# For direct testing
if __name__ == "__main__":
    scraper = OtodomScraper()
    scraper.start_scraping()