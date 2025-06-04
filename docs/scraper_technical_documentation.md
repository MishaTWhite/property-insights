# Otodom Scraper Technical Documentation

## Overview

The Otodom Scraper is a Python-based web scraping system designed to extract real estate listing data from the Otodom website (otodom.pl). The scraper collects information about property listings including price per square meter, area, floor, number of rooms, city, and district information. This data is then stored in a SQLite database for further analysis and visualization.

## Architecture

The scraper has been refactored into a modular architecture with the following components:

### Module Structure

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

### Module Interactions

The modules interact in the following way:

```
run_scraper.py
    ↓ (creates)
OtodomScraper
    ↓ (uses)
    ├── filters.py (should_skip_offer)
    ├── pagination.py (should_continue_pagination)
    ├── offer_parser.py (parse_offer_json)
    └── storage.py (insert_listing, clear_listings)
        ↓ (uses)
        db.py (setup_database)
```

### Separation of Concerns

Each module has a specific responsibility:

- **offer_parser.py**: Focuses solely on extracting and normalizing data from JSON structures
- **filters.py**: Contains all logic for determining if an offer should be included based on filters
- **pagination.py**: Handles logic for determining when to stop pagination
- **storage.py**: Manages database operations for the scraper
- **db.py**: Provides database setup and query functions for both scraper and API

This separation makes the code more maintainable and testable, as each component can be tested in isolation.

## Database Structure and Paths

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

### Database Path Configuration

**Important**: There are two database paths in the system:

1. **Python Scraper Database Path**:
   ```python
   # In db.py
   db_path = Path(__file__).resolve().parent / 'otodom.db'  # /server/src/otodom_parser/otodom.db
   ```

2. **Node.js API Database Path**:
   ```javascript
   // In otodom-analyzer.js
   const DB_PATH = path.join(__dirname, '../otodom.db');  // /server/src/otodom.db
   ```

To ensure proper functionality, the database file must be accessible at both locations. This can be achieved by:
- Copying the database file after scraping
- Using a symlink
- Modifying one of the paths to match the other

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

## Database Operations

The database operations are now handled by two modules:

1. **storage.py**: Handles basic insert and clear operations for the scraper
   ```python
   def insert_listing(
       city: str, 
       district: str, 
       district_parent: str, 
       area: float, 
       price_per_sqm: int, 
       floor: int = 0,
       rooms: Optional[int] = None
   ) -> bool:
       # Insert listing into database
       # Note: This function does NOT set the scraped_at timestamp
   ```

2. **db.py**: Provides more advanced database functions including:
   ```python
   def insert_listing(city, district, district_parent, area, price_per_sqm, floor, rooms=None):
       # Get current timestamp
       timestamp = datetime.now().isoformat()
       
       # Insert the listing with timestamp
       cursor.execute('''
       INSERT INTO listings (city, district, district_parent, area, price_per_sqm, floor, rooms, scraped_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ''', (city, district, district_parent, area, price_per_sqm, floor, rooms, timestamp))
   ```

### Important Note on `scraped_at` Field

There is a discrepancy between the two database modules:
- `db.py` correctly sets the `scraped_at` field to the current timestamp
- `storage.py` does not set the `scraped_at` field, resulting in NULL values

This discrepancy needs to be resolved to ensure all records have a valid `scraped_at` timestamp.

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

### Preserving Existing Data

To scrape multiple cities without clearing the database between runs (preserving data between runs), use the `--preserve` flag:

```bash
# First scrape Warsaw
python run_scraper.py --cities warszawa

# Then add Krakow data without clearing Warsaw data
python run_scraper.py --cities krakow --preserve

# Then add Wroclaw data
python run_scraper.py --cities wroclaw --preserve
```

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

2. **API Endpoints**: The Node.js server provides several API endpoints for interacting with the scraped data:
   - `/api/otodom-analyzer/data` - Get aggregated city statistics
   - `/api/otodom-analyzer/district-rooms` - Get district statistics with room breakdowns
   - `/api/otodom-analyzer/last-updated` - Get the timestamp of the most recent scrape
   - `/api/otodom-analyzer/start-scrape` - Start the scraper process
   - `/api/otodom-analyzer/status` - Get the current status of the scraper

3. **Database Path Issue**: The Node.js API and Python scraper use different database paths:
   - Python: `/server/src/otodom_parser/otodom.db`
   - Node.js: `/server/src/otodom.db`

   This discrepancy can cause the API to fail if the database file is not available at both locations.

## Known Issues and Recommendations

1. **Database Path Mismatch**: The Node.js API and Python scraper use different database paths. Options to resolve:
   - Modify the API code to use the same path as the Python code
   - Modify the Python code to save to the location expected by the API
   - Implement a symlink or file copy step in the deployment process

2. **`scraped_at` NULL Values**: The `storage.py` module does not set the `scraped_at` field, resulting in NULL values. Fix:
   - Update `storage.py` to include the `scraped_at` field in its INSERT statement
   - Use `db.py` for all database operations instead of `storage.py`

3. **Room Aggregation Logic**: The room aggregation logic in the API endpoint may fail if there are unexpected NULL values:
   - Add proper NULL handling in the room aggregation logic
   - Ensure all room categories are initialized with default values
   - Add error handling around the weighted average calculations

## Extending the Scraper

When extending the scraper, follow these guidelines:

1. **Adding New Fields**:
   - Add the field to both `storage.py` and `db.py` insert functions
   - Update the database schema in `db.py` setup_database function
   - Add migration code to add the column to existing databases

2. **Supporting New JSON Formats**:
   - Add new extraction strategies to the `extract_offers` method in `OtodomScraper`
   - Add corresponding parsing logic in `offer_parser.py`
   - Add tests with sample JSON fixtures

3. **Adding New Filters**:
   - Add the filter parameter to `run_scraper.py`
   - Implement the filtering logic in `filters.py`
   - Update the URL parameter construction in `OtodomScraper`

## Testing

The scraper includes unit tests for key components:

- `tests/test_filters.py` - Tests for district and room filtering
- `tests/test_extract_format_v4.py` - Tests for extracting data from the latest JSON format
- `tests/test_item_searchads_format.py` - Tests for extracting data from the searchAds format
- `tests/test_days_filter.py` - Tests for the days filter functionality
- `tests/test_db_migration.py` - Tests for database schema migrations
- `tests/test_room_feature.py` - Tests for room number extraction and mapping

To run the tests:

```bash
cd server/src/otodom_parser
python -m pytest
```

## Conclusion

The Otodom Scraper is a robust and flexible system for extracting real estate listing data from the Otodom website. Its modular architecture makes it easy to maintain and extend, while its comprehensive error handling and debugging features make it reliable in production. The scraped data is stored in a structured format in a SQLite database, ready for analysis and visualization through the web application.

The system has been recently refactored to improve modularity and maintainability, but there are still some issues to address, particularly around database path configuration and the `scraped_at` field.