import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  CircularProgress,
  FormHelperText
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

function CitySelector({ onCityChange, selectedCity }) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available cities on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  // Handle city selection change
  const handleCityChange = (event) => {
    if (onCityChange) {
      onCityChange(event.target.value);
    }
  };

  // Fetch cities from the API
  const fetchCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/otodom-stats/cities`);
      
      if (response.data && response.data.length > 0) {
        setCities(response.data);
        
        // If no city is selected yet and we have cities, select the first one
        if (!selectedCity && response.data.length > 0 && onCityChange) {
          onCityChange(response.data[0]);
        }
      } else {
        setCities([]);
        setError('No cities available');
      }
    } catch (err) {
      console.error('Failed to fetch cities:', err);
      setError('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minWidth: 120, mb: 3, maxWidth: 300 }}>
      <FormControl fullWidth error={!!error}>
        <InputLabel id="city-select-label">City</InputLabel>
        <Select
          labelId="city-select-label"
          id="city-select"
          value={selectedCity || ''}
          label="City"
          onChange={handleCityChange}
          disabled={loading || cities.length === 0}
          data-testid="city-selector"
        >
          {loading ? (
            <MenuItem value="" disabled>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              Loading...
            </MenuItem>
          ) : (
            cities.map((city) => (
              <MenuItem key={city} value={city} data-testid={`city-option-${city}`}>
                {city}
              </MenuItem>
            ))
          )}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    </Box>
  );
}

export default CitySelector;