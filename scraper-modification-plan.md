# Scraper Modification Plan

## Problem
The current implementation has duplicate URL generation logic in both `build_search_url()` and `scrape_page()` methods, which can lead to inconsistencies in how filters are applied.

## Solution
Modify the `scrape_page()` method to use the existing `build_search_url()` method instead of containing its own URL generation logic.

## Specific Changes Needed

In the `scraper.py` file, we need to replace the URL generation code in the `scrape_page()` method (lines 477-492) with a call to the `build_search_url()` method.

However, there's a key difference to address:
- `build_search_url()` uses `self.city_filter` and `self.district_filter` for location info
- `scrape_page()` takes `city` and `district` as parameters

To properly fix this, we need to temporarily set these class properties based on the parameters, call `build_search_url()`, and then restore the original values if necessary.

## Implementation Steps

1. Store original values of `self.city_filter` and `self.district_filter`
2. Set `self.city_filter` and `self.district_filter` to values from the parameters
3. Call `build_search_url()`
4. Restore original values
5. Continue with the rest of the method

This approach ensures that the URL is built consistently while still allowing `scrape_page()` to work with specific city and district parameters.