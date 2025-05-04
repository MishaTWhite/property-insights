# OtoDom Parser

This scraper extracts property listing data from OtoDom.pl.

## Running the Scraper

To run the scraper normally:

```bash
python run_scraper.py
```

Setting the `--debug` flag enables debug mode, which saves raw HTML and JSON responses for troubleshooting:

```bash
python run_scraper.py --debug
```

Debug files will be stored in the `debug` directory.

## Command Line Options

The scraper supports the following command line options:

| Option | Description |
|--------|-------------|
| `--debug` | Enable debug logging and save raw HTML/JSON responses |
| `--cities` | Comma or space separated list of cities to scrape (default: all major cities) |
| `--districts` | Comma or space separated list of districts to scrape (default: all) |
| `--district-mode` | How to match districts: 'exact' or 'prefix' (default) |
| `--rooms` | Integer or comma-separated list of room numbers to filter (e.g. 1,2) |
| `--days` | Filter listings by days since created (default: 1) |
| `--max-pages` | Maximum number of pages to scrape per city/district combination |
| `--preserve` | Preserve existing listings in the database |

## Filtering Options

For faster testing and partial scraping, you can use various filter options:

```bash
# Scrape only apartments in Warsaw with 1 bedroom, limited to 3 pages
python run_scraper.py --cities warszawa --rooms 1 --max-pages 3

# Scrape only specific districts in multiple cities
python run_scraper.py --cities "warszawa krakow" --districts "mokotow centrum"

# Scrape only 2 and 3-room apartments across all cities
python run_scraper.py --rooms 2,3
```

## Preserving Existing Data

To scrape multiple cities without clearing the database between runs (preserving data between runs), use the `--preserve` flag:

```bash
# First scrape Warsaw
python run_scraper.py --cities warszawa

# Then add Krakow data without clearing Warsaw data
python run_scraper.py --cities krakow --preserve

# Then add Wroclaw data
python run_scraper.py --cities wroclaw --preserve
```

## District Filtering Modes

The parser supports two district filtering modes:

- **Exact mode** (`--district-mode exact`): Only keeps listings where the district or district_parent exactly matches one of the specified districts. This is useful when you want to filter specifically for certain districts without getting results from similarly-named areas.

- **Prefix mode** (`--district-mode prefix`, default): Keeps listings where the district or district_parent starts with one of the specified districts. This is more inclusive and can be useful when you want to capture all sub-districts within a larger area.

Example usage:

```bash
# Only get listings in exactly "mokotow" district
python run_scraper.py --cities warszawa --districts mokotow --district-mode exact

# Get listings in "mokotow" and any sub-districts (default behavior)
python run_scraper.py --cities warszawa --districts mokotow
```

## Implementation Details

### Room Number Processing

The parser automatically handles the `roomsNumber` field in both numeric format and string enum format. String values like "ONE", "TWO", "THREE", etc. are automatically mapped to their corresponding integer values (1, 2, 3). Studio apartments ("STUDIO") are mapped to 0 rooms.

### JSON Data Extraction

The scraper pulls data directly from the official JSON API embedded in the Next.js page structure. This makes the scraper more reliable as it no longer depends on CSS selectors that can change frequently.

The process works as follows:
1. Fetch the listing page HTML
2. Extract the `__NEXT_DATA__` script tag containing the JSON data
3. Parse the JSON to access the offers list
4. Extract property details (area, price per square meter, floor, city, district)
5. Insert the data into the SQLite database

This approach is more efficient than HTML parsing and eliminates the need for complex CSS selectors.

### Price Per Square Meter Calculation

When price per square meter (`pricePerSquareMeter`) is missing from the listing data:
1. First attempts to retrieve it directly from the listing data
2. If not available, looks for alternative fields like `pricePerSqm`
3. If still not available, calculates it by dividing the total price by the area:
   - `price_per_sqm = total_price / area`

This ensures price per square meter data is available for all listings, even when the original data doesn't include it explicitly.

### Debug Mode

When running with the `--debug` flag:

1. Logging level will be set to DEBUG, providing more detailed output
2. HTML content of all pages will be saved in the `debug` directory
3. The debug directory is located at `<script_location>/debug/`

The saved HTML files are named in the format: `city_district_page.html` (e.g., `warsaw_mokotow_1.html`)

### Testing

Unit tests are available to verify that the JSON parsing works correctly. The tests use sample JSON fixtures that represent the actual data structure from the Otodom website.

## Analyzing HTML Files

The saved HTML files can be used to debug and update selectors when the site structure changes.