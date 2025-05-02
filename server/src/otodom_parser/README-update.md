## Running the Scraper

To run the scraper:

```bash
python run_scraper.py
```

Setting the `--debug` flag enables debug mode, which saves raw HTML and JSON responses for troubleshooting:

```bash
python run_scraper.py --debug
```

Debug files will be stored in the `debug` directory.

### Filtering Options

For faster testing and partial scraping, you can use the following filter options:

```bash
# Scrape only apartments in Warsaw with 1 bedroom, limited to 3 pages
python run_scraper.py --cities warszawa --rooms 1 --max-pages 3

# Scrape only specific districts in multiple cities
python run_scraper.py --cities "warszawa krakow" --districts "mokotow centrum"

# Scrape only 2 and 3-room apartments across all cities
python run_scraper.py --rooms 2,3
```