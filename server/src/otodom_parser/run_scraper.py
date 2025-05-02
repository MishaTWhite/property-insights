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

# Set up argument parser for debug flag
parser = argparse.ArgumentParser()
parser.add_argument("--debug", action="store_true", help="Enable debug logging")
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

    def update_status(status, progress, error):
        """Print status updates in a format the Node.js process can parse"""
        print(f"STATUS: {status}")
        print(f"PROGRESS: {progress}")
        print(f"ERROR: {1 if error else 0}")
        sys.stdout.flush()

    # Create scraper with debug flag
    scraper = OtodomScraper(debug=args.debug)
    scraper.start_scraping(callback=update_status)

except Exception as e:
    print(f"ERROR_INIT: {str(e)}")
    print(traceback.format_exc())
    sys.exit(1)