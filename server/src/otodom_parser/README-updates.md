# Otodom Parser Updates

## District Filtering Modes

The parser now supports two district filtering modes:

- **Exact mode** (`--district-mode exact`): Only keeps listings where the district or district_parent exactly matches one of the specified districts. This is useful when you want to filter specifically for certain districts without getting results from similarly-named areas.

- **Prefix mode** (`--district-mode prefix`, default): Keeps listings where the district or district_parent starts with one of the specified districts. This is more inclusive and can be useful when you want to capture all sub-districts within a larger area.

Example usage:

```bash
# Only get listings in exactly "mokotow" district
python run_scraper.py --cities warszawa --districts mokotow --district-mode exact

# Get listings in "mokotow" and any sub-districts (default behavior)
python run_scraper.py --cities warszawa --districts mokotow
```

## Price Per Square Meter Calculation

The parser now includes an automatic fallback calculation for listings where the price per square meter (`pricePerSquareMeter`) is missing:

1. First, it attempts to retrieve the price per square meter directly from the listing data.
2. If not available, it looks for alternative fields like `pricePerSqm`.
3. If still not available, it calculates the price per square meter by dividing the total price by the area:
   - `price_per_sqm = total_price / area`

This ensures you get price per square meter data for all listings, even when the original data doesn't include it explicitly.