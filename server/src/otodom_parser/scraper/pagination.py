"""
Module for controlling pagination logic in the scraper
"""
import logging
from typing import Optional, Tuple, Dict, Any


def should_continue_pagination(city: str, district: str, page: int, inserted_rows: int, max_filtered_pages: dict) -> bool:
    """
    Determine if scraper should continue to the next page
    
    Args:
        city: Current city being scraped
        district: Current district being scraped
        page: Current page number
        inserted_rows: Number of rows inserted from the current page
        max_filtered_pages: Dictionary containing max page numbers per city-district
        
    Returns:
        True if scraper should continue to the next page, False otherwise
    """
    key = f"{city}-{district}"
    if inserted_rows == 0:
        return False
    if key in max_filtered_pages and page >= max_filtered_pages[key]:
        return False
    return True