# OtoDom Parser

This scraper extracts property listing data from OtoDom.pl.

## Running the Scraper

To run the scraper normally:

```bash
python run_scraper.py
```

### Scraping Multiple Cities Sequentially

To scrape multiple cities without clearing the database between runs (preserving data between runs), use the `--preserve` flag:

```bash
# First scrape Warsaw
python run_scraper.py --cities warszawa

# Then add Krakow data without clearing Warsaw data
python run_scraper.py --cities krakow --preserve

# Then add Wroclaw data
python run_scraper.py --cities wroclaw --preserve
```

## Debug Mode

To run the scraper in debug mode:

```bash
python run_scraper.py --debug
```

## Implementation Notes

### Room Number Processing
The parser automatically handles the `roomsNumber` field in both numeric format and string enum format. String values like "ONE", "TWO", "THREE", etc. are automatically mapped to their corresponding integer values (1, 2, 3). Studio apartments ("STUDIO") are mapped to 0 rooms.

### JSON Data Extraction

The scraper now pulls data directly from the official JSON API embedded in the Next.js page structure. This makes the scraper more reliable as it no longer depends on CSS selectors that can change frequently.

The process works as follows:
1. Fetch the listing page HTML
2. Extract the `__NEXT_DATA__` script tag containing the JSON data
3. Parse the JSON to access the offers list
4. Extract property details (area, price per square meter, floor, city, district)
5. Insert the data into the SQLite database

This approach is more efficient than HTML parsing and eliminates the need for complex CSS selectors.

### District Filtering

The parser supports two district filtering modes:

- **Exact mode** (`--district-mode exact`): Only keeps listings where the district or district_parent exactly matches one of the specified districts.
- **Prefix mode** (`--district-mode prefix`, default): Keeps listings where the district or district_parent starts with one of the specified districts.

Example usage:
```bash
# Only get listings in exactly "mokotow" district
python run_scraper.py --cities warszawa --districts mokotow --district-mode exact

# Get listings in "mokotow" and any sub-districts (default behavior)
python run_scraper.py --cities warszawa --districts mokotow
```

### Price Per Square Meter Calculation

When price per square meter (`pricePerSquareMeter`) is missing from the listing data:
1. First attempts to retrieve it directly from the listing data
2. If not available, looks for alternative fields like `pricePerSqm`
3. If still not available, calculates it by dividing the total price by the area:
   - `price_per_sqm = total_price / area`

This ensures price per square meter data is available for all listings.

### Testing

Unit tests are available to verify that the JSON parsing works correctly. The tests use sample JSON fixtures that represent the actual data structure from the Otodom website.

When running with the `--debug` flag:

1. Logging level will be set to DEBUG, providing more detailed output
2. HTML content of all pages will be saved in the `debug` directory
3. The debug directory is located at `<script_location>/debug/`

The saved HTML files are named in the format: `city_district_page.html` (e.g., `warsaw_mokotow_1.html`)

## Analyzing HTML Files

The saved HTML files can be used to debug and update selectors when the site structure changes.