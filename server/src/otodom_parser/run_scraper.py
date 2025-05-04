import sys
import os
import traceback
import io
import argparse
from pathlib import Path

# Force UTF-8 for all console output
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests, bs4, lxml
    import logging
except ImportError as e:
    print("Missing Python package:", e.name, "— run pip install -r requirements.txt", file=sys.stderr)
    sys.exit(1)

# Set up argument parser for debug flag and filters
parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true", help="Enable debug logging")
parser.add_argument("--cities", type=str, help="Comma or space separated list of cities to scrape (default: all major cities)")
parser.add_argument("--districts", type=str, default="all", help="Comma or space separated list of districts to scrape (default: all)")
parser.add_argument("--district-mode", type=str, choices=["exact", "prefix"], default="prefix", 
                    help="How to match districts: 'exact' (exact match only) or 'prefix' (match prefix or parent slugs, default)")
parser.add_argument("--rooms", type=str, help="Integer or comma-separated list of room numbers to filter (e.g. 1,2)")
parser.add_argument("--days", type=int, default=1, help="Filter listings by days since created (default: 1)")
parser.add_argument("--max-pages", type=int, help="Maximum number of pages to scrape per city/district combination")
parser.add_argument("--preserve", action="store_true", help="Preserve existing listings in the database")
args = parser.parse_args()

# Configure logging level based on --debug flag or LOG_LEVEL environment variable
log_level = logging.DEBUG if args.debug or os.getenv("LOG_LEVEL") == "DEBUG" else logging.INFO

# Configure logging before any imports that might use logging
logging.basicConfig(level=log_level, 
                   format="%(asctime)s [%(levelname)s] %(message)s",
                   handlers=[
                       logging.FileHandler("parser_errors.log", encoding="utf-8"),
                       logging.StreamHandler(sys.stdout)
                   ])

try:
    from otodom_parser.scraper import OtodomScraper
    
    # Process filter arguments
    city_filter = None
    if args.cities:
        city_filter = [city.strip() for city in args.cities.replace(',', ' ').split() if city.strip()]
    
    district_filter = ["all"]
    if args.districts and args.districts != "all":
        district_filter = [district.strip() for district in args.districts.replace(',', ' ').split() if district.strip()]
    
    room_filter = None
    if args.rooms:
        room_filter = [int(room.strip()) for room in args.rooms.replace(',', ' ').split() if room.strip().isdigit()]
    
    max_pages = args.max_pages

    def update_status(status, progress, error):
        """Print status updates in a format the Node.js process can parse"""
        print(f"STATUS: {status}")
        print(f"PROGRESS: {progress}")
        print(f"ERROR: {1 if error else 0}")
        sys.stdout.flush()

    # Create scraper with debug flag and filters
    scraper = OtodomScraper(debug=args.debug, city_filter=city_filter, 
                          district_filter=district_filter, district_mode=args.district_mode,
                          room_filter=room_filter, max_pages=max_pages,
                          preserve=args.preserve, days_filter=args.days)
    scraper.start_scraping(callback=update_status)

except Exception as e:
    print(f"ERROR_INIT: {str(e)}")
    print(traceback.format_exc())
    sys.exit(1)