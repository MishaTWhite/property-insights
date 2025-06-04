# HTML Fixtures for Otodom Scraper

These static HTML files act as “golden data” for unit & integration tests of the Otodom scraping module.

## File list
| File name            | Type of listing | Saved from URL (date) |
|----------------------|-----------------|-----------------------|
| listing_page_1.html  | Search results page (pagination) | otodom.pl …  (2025-05-28) |
| offer_1.html         | Apartment listing | otodom.pl/oferta…    (2025-05-28) |
| offer_2.html         | Parking spot listing | otodom.pl/oferta…    (2025-05-28) |
| offer_3.html         | House listing | otodom.pl/oferta…    (2025-05-28) |

## How to add/update fixtures
1. Open the target page in a regular browser session (ensure you are **not** logged in).
2. Press `Ctrl+U` → `Ctrl+S` and choose **Webpage, HTML only**.  
   Alternatively use cURL with realistic headers:
   curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -H "Accept-Language: pl-PL,pl;q=0.9" -o new_fixture.html "<URL>"
3. Mask any personal data (names, phone numbers) with *** if present.
4. Place the file in this folder and update the table above.
5. Commit the change in a dedicated PR titled “Update fixture: <filename>”.

> ⚠️  Never reference live network calls inside unit tests.  
> Tests must read these offline fixtures to remain deterministic and CI-friendly.
