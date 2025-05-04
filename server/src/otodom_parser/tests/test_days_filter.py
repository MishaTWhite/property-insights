import sys
import pathlib
import pytest

# Add the parent directory to the path to make the package importable
sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))

# Import the real OtodomScraper class
from otodom_parser.scraper import OtodomScraper

def test_default_days_url():
    """Test that daysSinceCreated=1 is added to the URL by default"""
    scraper = OtodomScraper()
    
    # This will fail because build_search_url doesn't exist yet
    url = scraper.build_search_url("warszawa", "mokotow", 1)
    
    # This assertion will only be reached if build_search_url exists
    assert 'daysSinceCreated=1' in url
        
def test_custom_days_url():
    """Test that daysSinceCreated=N is added to the URL when days is specified"""
    # This will fail because days_filter parameter doesn't exist yet
    # or build_search_url doesn't exist yet
    scraper = OtodomScraper(days_filter=7)
    
    url = scraper.build_search_url("warszawa", "mokotow", 1)
    assert 'daysSinceCreated=7' in url

def test_invalid_days():
    """Test that ValueError is raised for 0 or negative values"""
    # This will fail because days_filter parameter doesn't exist yet
    # or build_search_url doesn't exist yet
    scraper = OtodomScraper(days_filter=0)
    
    with pytest.raises(ValueError, match=r"Days filter must be a positive integer"):
        scraper.build_search_url("warszawa", "mokotow", 1)

@pytest.mark.skip(reason="requires days filter")
def test_days_with_other_filters():
    """Test that days filter works with other filters"""
    scraper = OtodomScraper(
        city_filter=["warszawa"],
        district_filter=["mokotow"],
        room_filter=[2, 3],
        days_filter=7
    )
    
    url = scraper.build_search_url("warszawa", "mokotow", 1)
    assert 'daysSinceCreated=7' in url
    assert 'page=1' in url
    assert 'roomsNumber=' in url

@pytest.mark.skip(reason="requires days filter")
def test_large_days_value():
    """Test that very large day values work correctly"""
    scraper = OtodomScraper(days_filter=365)
    
    url = scraper.build_search_url("warszawa", "mokotow", 1)
    assert f'daysSinceCreated=365' in url