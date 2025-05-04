# Fix for Scraper Pagination Issue with Days Filter

## Problem Identified
The issue occurs with the pagination logic in the Otodom scraper. When running with a days filter (e.g., `--days 1`), the scraper correctly filters the first few pages but then continues to scrape additional pages that don't match the filter criteria.

The root cause is in the `scraper.py` file on line 569:
```python
# Check if there are more pages
has_next_page = len(offers) > 0
```

This logic checks if any offers were found on the page, but doesn't verify if any of these offers actually match our filter criteria. This is problematic because:

1. After processing the first pages, Otodom's website might still return results that don't match our filter criteria
2. The scraper continues to the next page as long as *any* offers are found, even if none of them match our filters
3. This causes the scraper to unnecessarily process pages that won't yield any valid results

## Solution
The solution is to change the pagination logic to check if any offers were actually *inserted into the database* after applying our filter criteria, rather than just checking if any offers were found on the page.

In `scraper.py`, line 569 should be changed from:
```python
# Check if there are more pages
has_next_page = len(offers) > 0
```

To:
```python
# Check if there are more pages with offers that match our filter criteria
has_next_page = inserted_rows > 0
```

This ensures that pagination only continues if at least one offer matching our filter criteria (including the days filter) was found on the current page and inserted into the database.

## Implementation Steps
1. Open the `server/src/otodom_parser/scraper.py` file
2. Find line 569 where the pagination logic is defined
3. Replace `len(offers) > 0` with `inserted_rows > 0`
4. Update the comment to clarify the logic

After this change, the scraper will correctly stop pagination when no more matching offers are found and move on to the next city or district.