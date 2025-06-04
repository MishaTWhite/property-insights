# Scraper Pagination Filter Fix

## Problem Summary
The scraper was correctly determining the number of pages to scrape with the `daysSinceCreated=1` filter, but on the last page, this filter was getting lost. This resulted in unfiltered results being included in the scraped data, defeating the purpose of the filter.

## Root Cause
The issue was related to URL redirects. When making requests to Otodom, especially on the last page, the site was redirecting to a URL that dropped the `daysSinceCreated` parameter. The code wasn't checking for this redirection or preserving the filter parameter after redirects.

## Solution Implemented

I added the following improvements to the `scrape_page` method in `scraper.py`:

1. **Enhanced logging**: Added detailed logging that shows the exact URL being requested for each page.
   ```python
   logging.debug(f"Requesting page {page} with filter URL: {url}")
   ```

2. **Redirect detection**: Added code to detect when a redirect occurs by comparing the original request URL with the final response URL.
   ```python
   final_url = response.url
   if url != final_url:
       logging.warning(f"URL was redirected: {url} -> {final_url}")
   ```

3. **Filter preservation**: Added logic to check if the `daysSinceCreated` parameter is present in the final URL after a redirect. If not, the code adds it back and makes a new request.
   ```python
   if f"daysSinceCreated={self.days_filter}" not in final_url:
       logging.error(f"Critical: daysSinceCreated filter was lost in redirect for page {page}!")
       # Re-add the days filter parameter if it's missing
       if "?" in final_url:
           final_url = f"{final_url}&daysSinceCreated={self.days_filter}"
       else:
           final_url = f"{final_url}?daysSinceCreated={self.days_filter}"
       # Make a new request with the corrected URL
       logging.debug(f"Retrying with corrected URL: {final_url}")
       response = self._make_request(final_url)
   ```

4. **Improved response logging**: Updated the response logging to use the actual final URL from the response object instead of the original request URL.
   ```python
   logging.debug(f"GET {response.url} -> {response.status_code} {len(response.content)}B")
   ```

## Benefits of This Solution

- **Transparency**: The enhanced logging provides visibility into the exact URLs being requested and any redirects that occur.
- **Consistency**: The filter is now preserved across all pages, ensuring consistent filtered results.
- **Reliability**: The scraper now correctly handles redirects that might otherwise cause filters to be lost.
- **Maintainability**: The explicit checks and logging make it easier to diagnose similar issues in the future.

This fix ensures that the `daysSinceCreated` filter is consistently applied across all pages, including the last page, which was previously returning unfiltered results.