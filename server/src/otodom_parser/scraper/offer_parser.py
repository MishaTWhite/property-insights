"""
Module for parsing Otodom offer data from JSON responses
"""
import logging
import traceback
import re
from typing import Dict, Optional, Any, Union


def to_float(v):
    """Convert a value to float, handling None values and formatting Polish number strings
    
    Args:
        v: The value to convert, can be None, string, or number
        
    Returns:
        float value or None if conversion fails
    """
    try:
        if v is None:
            return None
        if isinstance(v, str):
            v = v.replace(' ', '').replace(',', '.')
            match = re.search(r'[\d.]+', v)
            if match:
                return float(match[0])
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def safe_lower(x, default="unknown"):
    """Safely convert a string or dict with name/label/value/fullName key to lowercase
    
    Args:
        x: The value to convert, can be a string or dict
        default: Default value to return if conversion isn't possible
        
    Returns:
        Lowercase string or default value
    """
    if isinstance(x, str):
        return x.lower()
    if isinstance(x, dict):
        for k in ("name", "label", "value", "fullName"):
            if k in x and isinstance(x[k], str):
                return x[k].lower()
    return default


def parse_offer_json(offer):
    """Extract information from a JSON offer object"""
    try:
        logging.debug("Parsing offer JSON...")
        
        # Extract area from JSON
        area = to_float(offer.get("areaInSquareMeters"))
        if area is None:
            area = to_float(offer.get("areaInM2"))
            
        if area is not None:
            logging.debug(f"Found area: {area}")
        else:
            logging.debug(f"Skipped offer {offer.get('id', 'unknown')} (area=None)")
            return None
        
        # Extract price per sqm from JSON or calculate if missing
        ppsm_data = offer.get("pricePerSquareMeter")
        if isinstance(ppsm_data, dict):
            ppsm = to_float(ppsm_data.get("value"))
        else:
            ppsm = None
            
        if ppsm is not None:
            price_per_sqm = int(ppsm)
            logging.debug(f"Found price per sqm (pricePerSquareMeter.value): {price_per_sqm}")
        elif "pricePerSqm" in offer:
            price_per_sqm = to_float(offer["pricePerSqm"])
            if price_per_sqm is not None:
                price_per_sqm = int(price_per_sqm)
                logging.debug(f"Found price per sqm (pricePerSqm): {price_per_sqm}")
        else:
            # Try to calculate price per sqm from total price if available
            total_price = offer.get("totalPrice")
            if isinstance(total_price, dict):
                total = to_float(total_price.get("value"))
            else:
                total = None
            if total is None:
                total = to_float(offer.get("price"))
            
            if total is not None and area > 0:
                price_per_sqm = int(round(total / area))
                logging.debug(f"Calculated price per sqm from price ({total}) / area ({area}) = {price_per_sqm}")
            else:
                # Second fallback: try priceFromPerSquareMeter
                pfsqm = offer.get("priceFromPerSquareMeter")
                if isinstance(pfsqm, dict):
                    ppsm = to_float(pfsqm.get("value"))
                    if ppsm is not None:
                        price_per_sqm = int(ppsm)
                        logging.debug(f"Found price per sqm (priceFromPerSquareMeter.value): {price_per_sqm}")
                    else:
                        price_per_sqm = None
                else:
                    price_per_sqm = None
                
                if price_per_sqm is None:
                    logging.debug(f"Price per sqm not found and could not be calculated (price={total}, area={area})")
        
        # Skip offers with missing price_per_sqm
        if price_per_sqm is None:
            logging.debug(f"Skipped offer {offer.get('id', 'unknown')} (area={area}, ppsm=None)")
            return None
        
        # Extract floor from JSON with support for string floor values
        floor_map = {
            "GROUND": 0, "FIRST": 1, "SECOND": 2, "THIRD": 3,
            "FOURTH": 4, "FIFTH": 5, "SIXTH": 6, "SEVENTH": 7,
            "ABOVE_TENTH": 11, "TENTH": 10, "NINTH": 9, "EIGHTH": 8
        }
        
        floor_number = offer.get("floorNumber")
        floor = floor_map.get(str(floor_number).upper(), 0) if floor_number else 0
        logging.debug(f"Mapped floorNumber '{floor_number}' to: {floor}")
        
        # Extract number of rooms
        _ROOMS_MAP = {
            "STUDIO": 0,
            "ONE": 1, "TWO": 2, "THREE": 3, "FOUR": 4,
            "FIVE": 5, "SIX": 6, "SEVEN": 7,
            "EIGHT": 8, "NINE": 9, "TEN": 10,
            "FIVE_OR_MORE": 5,  # fallback
            "TEN_OR_MORE": 10,
        }
        
        rooms = None
        rooms_raw = offer.get("roomsNumber")
        if isinstance(rooms_raw, int):
            rooms = rooms_raw
        elif isinstance(rooms_raw, str):
            rooms = _ROOMS_MAP.get(rooms_raw.upper())
        else:
            rooms = None
            
        logging.debug(f"rooms={rooms_raw}->{rooms}")
        
        # Extract city and district from new format if available
        city = ""
        district_sub = "unknown"
        district_parent = "unknown"
        
        if ("location" in offer and 
            isinstance(offer["location"], dict) and
            "address" in offer["location"] and
            isinstance(offer["location"]["address"], dict) and
            "city" in offer["location"]["address"]):
            
            city_obj = offer["location"]["address"]["city"]
            city = safe_lower(city_obj)
            logging.debug(f"Found city from location.address.city: {city}")
            
            # Try to get district from reverseGeocoding locations
            if ("reverseGeocoding" in offer["location"] and
                isinstance(offer["location"]["reverseGeocoding"], dict) and
                "locations" in offer["location"]["reverseGeocoding"] and
                isinstance(offer["location"]["reverseGeocoding"]["locations"], list) and
                len(offer["location"]["reverseGeocoding"]["locations"]) > 0):
                
                locations = offer["location"]["reverseGeocoding"]["locations"]
                path = locations[-1]["id"].split("/") if locations else []
                district_sub = safe_lower(path[-1]) if path else "unknown"
                district_parent = safe_lower(path[-2]) if len(path) >= 2 else district_sub
                
                logging.debug(f"Found district_sub from reverseGeocoding: {district_sub}")
                logging.debug(f"Found district_parent from reverseGeocoding: {district_parent}")
        else:
            # Fall back to old format
            city = safe_lower(offer.get("location", {}).get("city", ""))
            district_sub = safe_lower(offer.get("location", {}).get("district", "")) or "unknown"
            district_parent = district_sub  # In old format, use the same value for both
            logging.debug(f"Using old format location data: city={city}, district_sub={district_sub}, district_parent={district_parent}")
        
        result = {
            'area': area,
            'price_per_sqm': price_per_sqm,
            'floor': floor,
            'rooms': rooms,
            'city': city,
            'district': district_sub,
            'district_parent': district_parent
        }
        logging.debug(f"Parsed offer data: {result}")
        return result
    except Exception as e:
        logging.error(f"Failed to parse offer JSON: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        return None