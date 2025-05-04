# Fixed implementation of scrape_page that uses build_search_url
# Replace the scrape_page method in server/src/otodom_parser/scraper.py with this implementation

def scrape_page(self, city, district, page=1):
    """Scrape a single page of listings"""
    # Use the build_search_url method to ensure consistency
    url = self.build_search_url(self.days_filter, page)
    
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
            
        # Here we populate the database with scraped offers
        for offer in offers:
            self.db.insert_offer(offer)
        
        return True, len(offers)
    except Exception as e:
        logging.error(f"Error parsing JSON: {e}")
        if self.debug:
            # Save the error for debugging
            error_file = self.debug_dir / f"{city}_{district}_{page}_error.txt"
            with open(error_file, 'w', encoding='utf-8') as f:
                traceback.print_exc(file=f)
            logging.debug(f"Saved error trace → {error_file}")
        return False, 0