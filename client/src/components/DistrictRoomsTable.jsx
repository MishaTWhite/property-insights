import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Component to display district statistics with room data
function DistrictRoomsTable({ selectedCity }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [expandedDistricts, setExpandedDistricts] = useState({});

  // Fetch district rooms data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/otodom-analyzer/district-rooms`);
        
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

  // Function to toggle expansion of parent districts
  const toggleDistrictExpansion = (districtId) => {
    setExpandedDistricts(prev => ({
      ...prev,
      [districtId]: !prev[districtId]
    }));
  };

  return (
    <TableContainer component={Paper} sx={{ mt: 4 }}>
      <Table size="small" aria-label="district rooms data">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell padding="checkbox"></TableCell>
            <TableCell><Typography variant="subtitle2" fontWeight="bold">District</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Listings</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">Avg price / m²</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">1-room</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">2-room</Typography></TableCell>
            <TableCell align="right"><Typography variant="subtitle2" fontWeight="bold">3+ rooms</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((parentDistrict) => {
            const districtId = `${parentDistrict.city}-${parentDistrict.district}`;
            const isExpanded = Boolean(expandedDistricts[districtId]);
            const hasChildDistricts = parentDistrict.childDistricts && parentDistrict.childDistricts.length > 0;
            
            return (
              <React.Fragment key={districtId}>
                {/* Parent District Row */}
                <TableRow 
                  sx={{ 
                    backgroundColor: '#f9f9f9',
                    '&:hover': { backgroundColor: '#f0f0f0' },
                    cursor: hasChildDistricts ? 'pointer' : 'default'
                  }}
                  onClick={() => hasChildDistricts && toggleDistrictExpansion(districtId)}
                >
                  <TableCell padding="checkbox">
                    {hasChildDistricts && (
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent the row click from being triggered
                          toggleDistrictExpansion(districtId);
                        }}
                      >
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    )}
                  </TableCell>
                  <TableCell component="th" scope="row">
                    <Typography variant="body2" fontWeight="bold">
                      {parentDistrict.district}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{parentDistrict.count}</TableCell>
                  <TableCell align="right">{parentDistrict.avg_ppsqm} zł</TableCell>
                  <TableCell align="right">
                    {parentDistrict.rooms["1"] ? (
                      <Typography variant="body2">
                        {parentDistrict.rooms["1"].count} ({parentDistrict.rooms["1"].avg_ppsqm} zł)
                      </Typography>
                    ) : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {parentDistrict.rooms["2"] ? (
                      <Typography variant="body2">
                        {parentDistrict.rooms["2"].count} ({parentDistrict.rooms["2"].avg_ppsqm} zł)
                      </Typography>
                    ) : "-"}
                  </TableCell>
                  <TableCell align="right">
                    {parentDistrict.rooms["3+"] ? (
                      <Typography variant="body2">
                        {parentDistrict.rooms["3+"].count} ({parentDistrict.rooms["3+"].avg_ppsqm} zł)
                      </Typography>
                    ) : "-"}
                  </TableCell>
                </TableRow>
                
                {/* Child District Rows (Expandable) */}
                {hasChildDistricts && (
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontStyle: 'italic' }}>
                            Districts in {parentDistrict.district}
                          </Typography>
                          <Table size="small" aria-label="child districts">
                            <TableBody>
                              {parentDistrict.childDistricts.map((childDistrict) => (
                                <TableRow key={childDistrict.district} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                  <TableCell padding="checkbox"></TableCell>
                                  <TableCell component="th" scope="row" sx={{ pl: 3 }}>
                                    <Typography variant="body2">
                                      {childDistrict.district}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">{childDistrict.count}</TableCell>
                                  <TableCell align="right">{childDistrict.avg_ppsqm} zł</TableCell>
                                  <TableCell align="right">
                                    {childDistrict.rooms["1"] ? (
                                      <Typography variant="body2">
                                        {childDistrict.rooms["1"].count} ({childDistrict.rooms["1"].avg_ppsqm} zł)
                                      </Typography>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell align="right">
                                    {childDistrict.rooms["2"] ? (
                                      <Typography variant="body2">
                                        {childDistrict.rooms["2"].count} ({childDistrict.rooms["2"].avg_ppsqm} zł)
                                      </Typography>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell align="right">
                                    {childDistrict.rooms["3+"] ? (
                                      <Typography variant="body2">
                                        {childDistrict.rooms["3+"].count} ({childDistrict.rooms["3+"].avg_ppsqm} zł)
                                      </Typography>
                                    ) : "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DistrictRoomsTable;