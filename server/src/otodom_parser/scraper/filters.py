"""
Module for handling offer filtering logic to determine which offers should be processed
"""
import logging
from typing import Dict, List, Any, Optional


def should_skip_offer(
    offer_data: Dict[str, Any], 
    district_filter: Optional[List[str]] = None,
    district_mode: str = "prefix"
) -> bool:
    """
    Determine if an offer should be skipped based on filters
    
    Args:
        offer_data: Parsed offer data including district information
        district_filter: List of districts to match or None/["all"] for no filtering
        district_mode: Mode to match districts - "exact" or "prefix"
        
    Returns:
        True if offer should be skipped, False if it should be processed
    """
    # If no district filter or "all" is specified, include all
    if not district_filter or "all" in district_filter:
        return False
    
    district = offer_data.get('district', '').lower()
    district_parent = offer_data.get('district_parent', '').lower()
    
    # Skip if district information is missing
    if not district and not district_parent:
        logging.debug("Skipping offer with missing district information")
        return True
    
    if district_mode == "exact":
        # Exact mode - either district or district_parent must be an exact match
        match_found = any(d.lower() == district or d.lower() == district_parent 
                          for d in district_filter)
    else:  # prefix mode (default)
        # Check if any filter is a prefix of either district or district_parent
        match_found = False
        for d in district_filter:
            d_lower = d.lower()
            if (district.startswith(d_lower) or 
                f"-{d_lower}" in district or
                district_parent.startswith(d_lower) or
                f"-{d_lower}" in district_parent):
                match_found = True
                break
    
    # Skip if no match found with the filters
    if not match_found:
        logging.debug(f"Skipping offer: district={district}, parent={district_parent} doesn't match filters")
        return True
        
    return False