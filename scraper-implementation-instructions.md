# Scraper Implementation Fix Instructions

## Problem Summary

The OtodomScraper class has a URL generation inconsistency:

1. The `build_search_url()` method properly builds URLs with all required parameters including `daysSinceCreated`
2. The `scrape_page()` method has its own URL generation logic that may not consistently apply filters
3. This inconsistency can lead to problems like the missing `daysSinceCreated` parameter observed in Warsaw page 3

## Required Change

Replace the URL generation code in `scrape_page()` method with a call to `build_search_url()`.

## Exact Implementation

In the file `server/src/otodom_parser/scraper.py`, find the `scrape_page()` method (around line 475), and replace these lines:

```python
def scrape_page(self, city, district, page=1):
    """Scrape a single page of listings"""
    url_path = f"{self.base_url}/{city}"
    if district:
        url_path += f"/{district}"
    
    # Start with base query parameters
    params = [f"page={page}", "viewType=list", f"daysSinceCreated={self.days_filter}"]
    
    # Add room filter parameters if specified
    if self.room_filter:
        room_params = ",".join(str(room) for room in self.room_filter)
        params.append(f"roomsNumber=%5B{room_params}%5D")
        
    # Join all parameters
    url = f"{url_path}?{'&'.join(params)}"
    
    logging.debug(f"Scraping URL: {url}")
    response = self._make_request(url)
    if not response:
        return False, None
```

With this implementation:

```python
def scrape_page(self, city, district, page=1):
    """Scrape a single page of listings"""
    # Use the build_search_url method to ensure consistency
    url = self.build_search_url(self.days_filter, page)
    
    logging.debug(f"Scraping URL: {url}")
    response = self._make_request(url)
    if not response:
        return False, None
```

## Important Note About Parameters

This change introduces a subtle change in behavior:

- The original implementation used the `city` and `district` parameters passed to `scrape_page()`
- The new implementation will use `self.city_filter` and `self.district_filter` from the class 
  (via `build_search_url()`)

If these values differ, the scraper's behavior will change. For full consistency between the original 
and new implementations, a more comprehensive approach would involve:

1. Temporarily storing original filter values
2. Setting class filters to match the parameters  
3. Calling `build_search_url()`
4. Restoring the original filter values

However, the problem statement specifically requests the more direct approach shown above.

## Expected Benefits

1. Consistent URL generation across all scraper operations
2. Proper application of the `daysSinceCreated` filter
3. Simplified code with reduced duplication
4. Easier maintenance as URL generation logic is centralized