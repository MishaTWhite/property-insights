# OtoDom Parser

This scraper extracts property listing data from OtoDom.pl.

## Running the Scraper

To run the scraper normally:

```bash
python run_scraper.py
```

## Debug Mode

To run the scraper in debug mode:

```bash
python run_scraper.py --debug
```

## Implementation Notes

### JSON Data Extraction

The scraper now pulls data directly from the official JSON API embedded in the Next.js page structure. This makes the scraper more reliable as it no longer depends on CSS selectors that can change frequently.

The process works as follows:
1. Fetch the listing page HTML
2. Extract the `__NEXT_DATA__` script tag containing the JSON data
3. Parse the JSON to access the offers list
4. Extract property details (area, price per square meter, floor, city, district)
5. Insert the data into the SQLite database

This approach is more efficient than HTML parsing and eliminates the need for complex CSS selectors.

### Testing

Unit tests are available to verify that the JSON parsing works correctly. The tests use sample JSON fixtures that represent the actual data structure from the Otodom website.

When running with the `--debug` flag:

1. Logging level will be set to DEBUG, providing more detailed output
2. HTML content of all pages will be saved in the `debug` directory
3. The debug directory is located at `<script_location>/debug/`

The saved HTML files are named in the format: `city_district_page.html` (e.g., `warsaw_mokotow_1.html`)

## Analyzing HTML Files

The saved HTML files can be used to debug and update selectors when the site structure changes.