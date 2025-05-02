import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';

// Component to display district statistics with room data
function DistrictRoomsTable({ selectedCity }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);

  // Fetch district rooms data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch('/api/otodom-analyzer/district-rooms');
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Error fetching district data:', err);
        setError('Failed to load district data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  // Filter data when selectedCity changes
  useEffect(() => {
    if (selectedCity && data.length > 0) {
      const filtered = data.filter(item => 
        item.city && item.city.toLowerCase() === selectedCity.toLowerCase()
      );
      setFilteredData(filtered);
      
      // If no data found after filtering, check if there might be a city name mismatch
      if (filtered.length === 0) {
        // Try partial matching as a fallback
        const partialMatched = data.filter(item => 
          item.city && item.city.toLowerCase().includes(selectedCity.toLowerCase())
        );
        
        if (partialMatched.length > 0) {
          setFilteredData(partialMatched);
        }
      }
    } else {
      setFilteredData(data);
    }
  }, [selectedCity, data]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box my={3}>
        <Typography color="error" align="center">{error}</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Table size="small" aria-label="district rooms data">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">District</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Listings</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Avg price / m²</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">1-room</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">2-room</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">3+ rooms</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((district) => (
            <TableRow key={district.district}>
              <TableCell component="th" scope="row">
                <Typography variant="body2" fontWeight="medium">
                  {district.district}
                </Typography>
              </TableCell>
              <TableCell align="right">{district.count}</TableCell>
              <TableCell align="right">{district.avg_ppsqm} zł</TableCell>
              <TableCell align="right">
                {district.rooms["1"] ? (
                  <Typography variant="body2">
                    {district.rooms["1"].count} ({district.rooms["1"].avg_ppsqm} zł)
                  </Typography>
                ) : "-"}
              </TableCell>
              <TableCell align="right">
                {district.rooms["2"] ? (
                  <Typography variant="body2">
                    {district.rooms["2"].count} ({district.rooms["2"].avg_ppsqm} zł)
                  </Typography>
                ) : "-"}
              </TableCell>
              <TableCell align="right">
                {district.rooms["3+"] ? (
                  <Typography variant="body2">
                    {district.rooms["3+"].count} ({district.rooms["3+"].avg_ppsqm} zł)
                  </Typography>
                ) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DistrictRoomsTable;