"""
Helper module for extracting area information from listing HTML pages
"""

import re
import json
import logging
import traceback
from bs4 import BeautifulSoup

def extract_area_from_html(html_content, to_float_func):
    """
    Extract area information from HTML content
    Returns the area as float or None if not found
    
    Args:
        html_content: The HTML content of the listing page
        to_float_func: Function to convert string to float
    """
    if not html_content:
        return None
        
    area = None
    try:
        # Parse HTML using BeautifulSoup
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Try to find area in structured data first (JSON-LD)
        json_ld_scripts = soup.find_all('script', {'type': 'application/ld+json'})
        for script in json_ld_scripts:
            try:
                json_data = json.loads(script.string)
                # Look for area in structured data
                if isinstance(json_data, dict):
                    # Try common JSON-LD formats for real estate
                    if 'floorSize' in json_data:
                        floor_size = json_data.get('floorSize', {})
                        if isinstance(floor_size, dict) and 'value' in floor_size:
                            area = to_float_func(floor_size.get('value'))
                            if area is not None:
                                logging.debug(f"Found area in JSON-LD floorSize: {area}")
                                return area
                    # Try other potential paths in JSON-LD
                    for key in ['size', 'area', 'floorArea', 'livingArea']:
                        if key in json_data:
                            area_val = json_data.get(key)
                            if isinstance(area_val, (str, int, float)):
                                area = to_float_func(area_val)
                            elif isinstance(area_val, dict) and 'value' in area_val:
                                area = to_float_func(area_val.get('value'))
                            if area is not None:
                                logging.debug(f"Found area in JSON-LD {key}: {area}")
                                return area
            except:
                # If JSON parsing fails, continue to next script
                continue
        
        # Look for common text patterns indicating area
        area_patterns = [
            r'(\d+[.,]?\d*)\s*m²', 
            r'(\d+[.,]?\d*)\s*m2',
            r'powierzchnia[:\s]*(\d+[.,]?\d*)\s*m',
            r'area[:\s]*(\d+[.,]?\d*)\s*m',
            r'metraz[:\s]*(\d+[.,]?\d*)',
            r'powierzchnia całkowita[:\s]*(\d+[.,]?\d*)',
            r'powierzchnia użytkowa[:\s]*(\d+[.,]?\d*)'
        ]
        
        for pattern in area_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            if matches:
                # Take the first match
                area = to_float_func(matches[0])
                if area is not None:
                    logging.debug(f"Found area using regex pattern '{pattern}': {area}")
                    return area
        
        # If still not found, look for specific HTML elements that might contain area
        # Look for elements with specific classes or data attributes
        area_elements = soup.select('[data-testid="ad-parameters-item-area"] span')
        if area_elements:
            for elem in area_elements:
                area_text = elem.get_text(strip=True)
                # Extract number from text
                area_match = re.search(r'(\d+[.,]?\d*)', area_text)
                if area_match:
                    area = to_float_func(area_match.group(1))
                    if area is not None:
                        logging.debug(f"Found area in HTML element: {area}")
                        return area
        
        # Try additional selector patterns
        additional_selectors = [
            '.css-1qvviw5',  # Common class for parameter values
            '.css-1ci0qpi',  # Another common class
            '[data-cy="ad-parameters-item-value"]',
            '[data-cy="adPageAdInfo"]',
            '.css-1435atw',  # Sometimes contains the area
            '[data-testid="table-value-usable_area"]'
        ]
        
        for selector in additional_selectors:
            elements = soup.select(selector)
            for elem in elements:
                text = elem.get_text(strip=True)
                if 'm²' in text or 'm2' in text:
                    # Extract number from text
                    area_match = re.search(r'(\d+[.,]?\d*)', text)
                    if area_match:
                        area = to_float_func(area_match.group(1))
                        if area is not None:
                            logging.debug(f"Found area using selector '{selector}': {area}")
                            return area
        
        # Try to look for specific table rows that might contain area
        for row in soup.select('tr'):
            row_text = row.get_text(strip=True).lower()
            if 'powierzchnia' in row_text or 'area' in row_text:
                area_match = re.search(r'(\d+[.,]?\d*)', row_text)
                if area_match:
                    area = to_float_func(area_match.group(1))
                    if area is not None:
                        logging.debug(f"Found area in table row: {area}")
                        return area
                        
        # Check if we have any divs with m² in their text
        for div in soup.find_all('div'):
            div_text = div.get_text(strip=True)
            if 'm²' in div_text or 'm2' in div_text:
                area_match = re.search(r'(\d+[.,]?\d*)', div_text)
                if area_match:
                    area = to_float_func(area_match.group(1))
                    if area is not None:
                        logging.debug(f"Found area in div text: {area}")
                        return area
        
    except Exception as e:
        logging.warning(f"Error extracting area from HTML: {str(e)}")
        logging.debug(traceback.format_exc())
            
    return None