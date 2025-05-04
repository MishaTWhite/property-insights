"""
Module for controlling pagination logic in the scraper
"""
import logging
from typing import Optional, Tuple, Dict, Any


def should_continue_pagination(page: int, inserted_rows: int) -> bool:
    """
    Determine if scraper should continue to the next page
    
    Args:
        page: Current page number
        inserted_rows: Number of rows inserted from the current page
        
    Returns:
        True if scraper should continue to the next page, False otherwise
    """
    return inserted_rows > 0  # placeholder logic