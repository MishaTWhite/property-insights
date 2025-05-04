# Otodom Scraper Technical Documentation

## Overview

The Otodom Scraper is a Python-based web scraping system designed to extract real estate listing data from the Otodom website (otodom.pl). The scraper collects information about property listings including price per square meter, area, floor, number of rooms, city, and district information. This data is then stored in a SQLite database for further analysis and visualization.

## Architecture

The scraper has been refactored into a modular architecture with the following components:

1. **Main Components**:
   - `OtodomScraper` class - Core orchestration of the scraping process
   - `run_scraper.py` - Command-line interface for running the scraper

2. **Modular Components**:
   - `scraper/offer_parser.py` - Handles parsing of offer JSON data
   - `scraper/filters.py` - Contains filtering logic for offers
   - `scraper/pagination.py` - Controls pagination behavior
   - `scraper/storage.py` - Handles database operations for storing offers
   - `db.py` - Database setup and query functions

3. **Support Components**:
   - `html_area_extractor.py` - Helper module for extracting area information from HTML

This modular architecture improves maintainability and allows for easier testing of individual components.

## Scraping Mechanism

### Initialization

The scraper is initialized with several parameters:

- `debug` - Enable debug mode for additional logging and HTML saving
- `city_filter` - List of cities to scrape (defaults to all major cities)
- `district_filter` - List of districts to scrape (defaults to all)
- `district_mode` - How to match districts ("exact" or "prefix")
- `room_filter` - Filter by number of rooms
- `max_pages` - Maximum number of pages to scrape per city/district
- `preserve` - Whether to preserve existing listings in the database
- `days_filter` - Only scrape listings from the last X days (default: 1)

### Scraping Process

1. **City Selection**: The scraper iterates through a list of predefined cities (Warsaw, Wroclaw, Gdansk, etc.) or a filtered subset.

2. **District Discovery**: For each city, the scraper attempts to discover available districts by analyzing the HTML structure of the city's main page.

3. **Pagination**: For each city/district combination, the scraper iterates through pages of listings until no more listings are found or the maximum page limit is reached.

4. **HTTP Requests**: The scraper makes HTTP requests to the Otodom website with appropriate headers to mimic a browser:
   ```python
   self.headers = {
       'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
       'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
   }
   ```

5. **Retry Logic**: The scraper implements a retry mechanism with exponential backoff for failed requests:
   ```python
   retry_delays = [2, 4, 8]  # Backoff strategy
   ```

6. **Days Filter**: The scraper can filter listings by how recently they were created:
   ```python
   params = [f"page={page}", "viewType=list", f"daysSinceCreated={self.days_filter}"]
   ```

### Data Extraction

The scraper extracts data from the Otodom website using several techniques:

1. **JSON Data Extraction**: The primary method is extracting data from the `__NEXT_DATA__` script tag, which contains a JSON representation of the page data. The scraper supports multiple JSON formats as the website structure has changed over time:

   ```python
   # Find the __NEXT_DATA__ script tag containing JSON data
   data_script = soup.find("script", id="__NEXT_DATA__")
   data = json.loads(data_script.string)
   ```

2. **Adaptive JSON Path Navigation**: The scraper tries multiple JSON paths to extract offers, adapting to different website versions:

   ```python
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
   ```

3. **Legacy Format Support**: The scraper also supports the legacy OtoDom site format with embedded JS objects:

   ```python
   # Strategy 3: Legacy OtoDom site format with embedded JS object
   if soup:
       data_container_script = None
       
       # Look for script with window.__INITIAL_STATE__
       for script in soup.find_all("script"):
           if script.string and "window.__INITIAL_STATE__" in script.string:
               data_container_script = script
               break
   ```

4. **HTML Parsing**: For specific fields like area, the scraper can fall back to direct HTML parsing using BeautifulSoup:

   ```python
   soup = BeautifulSoup(response.text, 'html.parser')
   ```

### Data Processing

Once raw data is extracted, the scraper processes it to normalize and clean the values:

1. **Area Conversion**: Converts area values to float, handling different formats:
   ```python
   def to_float(v):
       if v is None:
           return None
       if isinstance(v, str):
           v = v.replace(' ', '').replace(',', '.')
           match = re.search(r'[\d.]+', v)
           if match:
               return float(match[0])
           return None
       return float(v)
   ```

2. **Floor Mapping**: Maps string floor values to integers:
   ```python
   floor_map = {
       "GROUND": 0, "FIRST": 1, "SECOND": 2, "THIRD": 3,
       "FOURTH": 4, "FIFTH": 5, "SIXTH": 6, "SEVENTH": 7,
       "ABOVE_TENTH": 11, "TENTH": 10, "NINTH": 9, "EIGHTH": 8
   }
   ```

3. **Room Number Mapping**: Maps string room values to integers:
   ```python
   _ROOMS_MAP = {
       "STUDIO": 0,
       "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
       "FIVE": 5, "SIX": 6, "SEVEN": 7,
       "EIGHT": 8, "NINE": 9, "TEN": 10,
       "FIVE_OR_MORE": 5,  # fallback
       "TEN_OR_MORE": 10,
   }
   ```

4. **District Hierarchy**: Extracts both parent and sub-districts from the location data:
   ```python
   locations = offer["location"]["reverseGeocoding"]["locations"]
   path = locations[-1]["id"].split("/") if locations else []
   district_sub = safe_lower(path[-1]) if path else "unknown"
   district_parent = safe_lower(path[-2]) if len(path) >= 2 else district_sub
   ```

### Filtering Mechanisms

The scraper supports several filtering mechanisms, now implemented in a dedicated `filters.py` module:

1. **City Filtering**: Limits scraping to specific cities:
   ```python
   cities_to_scrape = [city for city in CITIES if self.city_filter is None or city.lower() in [c.lower() for c in self.city_filter]]
   ```

2. **District Filtering**: Filters listings by district using either exact or prefix matching:
   ```python
   def should_skip_offer(offer_data, district_filter, district_mode):
       # If no district filter or "all" is specified, include all
       if not district_filter or "all" in district_filter:
           return False
       
       district = offer_data.get('district', '').lower()
       district_parent = offer_data.get('district_parent', '').lower()
       
       if district_mode == "exact":
           # Exact mode - either district or district_parent must be an exact match
           match_found = any(d.lower() == district or d.lower() == district_parent 
                           for d in district_filter)
       else:  # prefix mode (default)
           # Check if any filter is a prefix of either district or district_parent
           match_found = False
           for d in district_filter:
               d_lower = d.lower()
               if (district.startswith(d_lower) or 
                   f"-{d_lower}" in district or
                   district_parent.startswith(d_lower) or
                   f"-{d_lower}" in district_parent):
                   match_found = True
                   break
       
       # Skip if no match found with the filters
       return not match_found
   ```

3. **Room Filtering**: Filters listings by number of rooms:
   ```python
   if self.room_filter:
       room_params = ",".join(str(room) for room in self.room_filter)
       params.append(f"roomsNumber=%5B{room_params}%5D")
   ```

4. **Days Since Created Filtering**: Filters listings by how recently they were created:
   ```python
   params = [f"page={page}", "viewType=list", f"daysSinceCreated={self.days_filter}"]
   ```

## Database Structure

The scraper stores data in a SQLite database with the following schema:

```sql
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    district_parent TEXT NOT NULL,
    area REAL NOT NULL,          -- m²
    price_per_sqm REAL NOT NULL, -- zł
    floor INTEGER,               -- 0 = parter
    rooms INTEGER,               -- number of rooms
    scraped_at TEXT              -- ISO timestamp
)
```

The database operations are now handled by two modules:

1. **storage.py**: Handles basic insert and clear operations for the scraper
2. **db.py**: Provides more advanced database functions including:
   - Database setup and connection management
   - Statistics retrieval for cities and districts
   - Support for room-based statistics
   - Hierarchical district data with parent-child relationships

## Error Handling and Debugging

The scraper implements comprehensive error handling and debugging features:

1. **Logging**: Detailed logging at different levels (INFO, DEBUG, WARNING, ERROR):
   ```python
   logging.basicConfig(
       format="%(asctime)s [%(levelname)s] %(message)s",
       handlers=[
           logging.FileHandler("parser_errors.log", encoding="utf-8"),
           logging.StreamHandler(sys.stdout)
       ])
   ```

2. **HTML Saving**: In debug mode, the scraper saves raw HTML responses for offline analysis:
   ```python
   if self.debug:
       dump_file = self.debug_dir / f"{city}_{district}_{page}.html"
       dump_file.write_bytes(response.content)
   ```

3. **JSON Saving**: In debug mode, the scraper saves extracted JSON data:
   ```python
   if self.debug and offers:
       json_dump_file = self.debug_dir / f"{city}_{district}_{page}_data.json"
       with open(json_dump_file, 'w', encoding='utf-8') as f:
           json.dump(offers, f, indent=2, ensure_ascii=False)
   ```

4. **Progress Tracking**: The scraper tracks progress and status for UI integration:
   ```python
   self.status = f"{city} - {district_name} p{page}"
   total_progress = ((city_idx + (district_idx / len(districts))) / total_cities) * 100
   self.progress = total_progress
   ```

5. **Callback Mechanism**: The scraper supports a callback function for real-time status updates:
   ```python
   if callback:
       callback(self.status, self.progress, self.error_occurred)
   ```

## Command-Line Interface

The scraper can be run from the command line with various options:

```
python run_scraper.py [options]

Options:
  --debug                Enable debug logging
  --cities CITIES        Comma or space separated list of cities to scrape
  --districts DISTRICTS  Comma or space separated list of districts to scrape
  --district-mode MODE   How to match districts: 'exact' or 'prefix'
  --rooms ROOMS          Integer or comma-separated list of room numbers to filter
  --days DAYS            Filter listings by days since created (default: 1)
  --max-pages MAX_PAGES  Maximum number of pages to scrape per city/district
  --preserve             Preserve existing listings in the database
```

The command-line interface is implemented in `run_scraper.py` and provides a user-friendly way to configure the scraper.

## Adaptation to Website Changes

The scraper is designed to be resilient to website structure changes:

1. **Multiple JSON Path Strategies**: The scraper tries multiple JSON paths to extract data, adapting to different website versions.

2. **Fallback Mechanisms**: If primary extraction methods fail, the scraper falls back to alternative methods like JSON-LD or direct HTML parsing.

3. **Flexible Field Mapping**: The scraper handles different field names and formats for the same data (e.g., "areaInSquareMeters" vs "areaInM2").

4. **Modular Architecture**: The separation of concerns into different modules makes it easier to update specific parts of the scraper when the website changes.

## Performance Considerations

1. **Rate Limiting**: The scraper implements a sleep between requests to avoid overloading the server:
   ```python
   time.sleep(1.5)  # Sleep between pages to avoid rate limiting
   ```

2. **Pagination Control**: The scraper limits the number of pages scraped per city/district:
   ```python
   if self.max_pages and page > self.max_pages:
       logging.info(f"Reached max pages ({self.max_pages}) for {city} - {district_name}")
       break
   ```

3. **Selective Scraping**: The scraper supports filtering by city, district, room count, and days since created to limit the amount of data scraped.

4. **Retry Logic**: The scraper implements exponential backoff for failed requests to handle temporary network issues.

## Integration with Node.js Server

The scraper is designed to be called from a Node.js server with status updates:

1. **Status Updates**: The scraper prints status updates in a format that can be parsed by the Node.js process:
   ```python
   def update_status(status, progress, error):
       """Print status updates in a format the Node.js process can parse"""
       print(f"STATUS: {status}")
       print(f"PROGRESS: {progress}")
       print(f"ERROR: {1 if error else 0}")
       sys.stdout.flush()
   ```

2. **Database Location**: The database is created in the server directory for easy access by the Node.js application:
   ```python
   db_path = Path(__file__).resolve().parents[1] / 'otodom.db'  # /server/otodom.db
   ```

3. **Error Handling**: The scraper reports errors in a way that can be captured by the calling process.

## Conclusion

The Otodom Scraper is a robust and flexible system for extracting real estate listing data from the Otodom website. Its modular architecture makes it easy to maintain and extend, while its comprehensive error handling and debugging features make it reliable in production. The scraped data is stored in a structured format in a SQLite database, ready for analysis and visualization through the web application.