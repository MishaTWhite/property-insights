# Otodom Parser - Room Feature Update

## Database Changes

The listings table has been extended with a new column:

- `rooms` (INTEGER, nullable): Stores the number of rooms for each listing.

## API Schema Updates

### New Endpoint: `/api/otodom-analyzer/district-rooms`

Returns district-level statistics with room count aggregation:

```json
[
  {
    "district": "mokotow",
    "avg_ppsqm": 19346,
    "count": 40,
    "rooms": {
      "1": {"avg_ppsqm": 21000, "count": 12},
      "2": {"avg_ppsqm": 19800, "count": 18},
      "3+": {"avg_ppsqm": 17500, "count": 10}
    }
  },
  ...
]
```

Room count categories:
- "1": 1-room apartments
- "2": 2-room apartments
- "3+": 3 or more room apartments

## CLI Usage

The existing room filtering option (`--rooms`) now filters based on the numeric room count value:

```bash
# Run scraper for 1 and 2-room apartments only
python run_scraper.py --city warszawa --rooms 1 2

# Run scraper for all apartments with 3 or more rooms
python run_scraper.py --city warszawa --rooms 3 4 5
```

## Integration with Frontend

A new component `DistrictRoomsTable` has been added to display district statistics broken down by room count, showing:
- District name
- Total listing count
- Average price per square meter
- Room-specific statistics for 1-room, 2-room, and 3+ room apartments