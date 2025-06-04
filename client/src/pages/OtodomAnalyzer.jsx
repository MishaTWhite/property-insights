import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Table, 
  TableBody,
  CircularProgress, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Alert,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import DistrictRoomsTable from '../components/DistrictRoomsTable';
import CitySelector from '../components/CitySelector';

// Base URL for API requests
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

function OtodomAnalyzer() {
  // State management
  const [status, setStatus] = useState('Ready');
  const [progress, setProgress] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cityData, setCityData] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedCityStats, setSelectedCityStats] = useState(null);
  const [loadingCityStats, setLoadingCityStats] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [openErrorLog, setOpenErrorLog] = useState(false);
  const [errorLogContent, setErrorLogContent] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  // Fetch status periodically when scraper is running
  useEffect(() => {
    let statusInterval;
    
    if (isRunning) {
      // Update status every second
      statusInterval = setInterval(() => {
        fetchStatus();
      }, 1000);
    }
    
    return () => {
      if (statusInterval) {
        clearInterval(statusInterval);
      }
    };
  }, [isRunning]);

  // Fetch initial data when component mounts
  useEffect(() => {
    fetchData();
    fetchLastUpdated();
  }, []);

  // Fetch city stats when selected city changes
  useEffect(() => {
    if (selectedCity) {
      fetchCityStats(selectedCity);
    }
  }, [selectedCity]);

  // Handle city selection change
  const handleCityChange = (city) => {
    setSelectedCity(city);
  };

  // Fetch stats for a specific city
  const fetchCityStats = async (city) => {
    try {
      setLoadingCityStats(true);
      const response = await axios.get(`${API_BASE_URL}/otodom-stats/stats?city=${encodeURIComponent(city)}`);
      setSelectedCityStats(response.data);
    } catch (error) {
      console.error('Failed to fetch city stats:', error);
      showAlert(`Failed to fetch stats for ${city}`, 'error');
      setSelectedCityStats({
        city,
        avg_price_sqm: null,
        listing_count: 0,
        districts: []
      });
    } finally {
      setLoadingCityStats(false);
    }
  };

  // Fetch scraper status
  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/otodom-analyzer/status`);
      const { status, progress, error, isRunning } = response.data;
      
      setStatus(status);
      setProgress(progress);
      setIsError(error);
      setIsRunning(isRunning);
      
      // If scraper just finished running, refresh data
      if (isRunning === false && isRunning !== isRunning) {
        fetchData();
        fetchLastUpdated();
        showAlert('Scraping process completed', 'success');
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  // Fetch city data
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/otodom-analyzer/data`);
      setCityData(response.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showAlert('Failed to fetch data', 'error');
    }
  };

  // Fetch last updated timestamp
  const fetchLastUpdated = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/otodom-analyzer/last-updated`);
      setLastUpdated(response.data.lastUpdated);
    } catch (error) {
      console.error('Failed to fetch last updated timestamp:', error);
    }
  };

  // Start the scraper
  const startScraper = async () => {
    try {
      await axios.post(`${API_BASE_URL}/otodom-analyzer/start-scrape`);
      setIsRunning(true);
      setStatus('Starting...');
      setProgress(0);
      showAlert('Scraper started', 'info');
    } catch (error) {
      console.error('Failed to start scraper:', error);
      showAlert('Failed to start scraper', 'error');
    }
  };

  // Fetch error logs
  const fetchErrorLogs = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/otodom-analyzer/error-logs`);
      setErrorLogContent(response.data.logs || 'No logs available');
      setOpenErrorLog(true);
    } catch (error) {
      console.error('Failed to fetch error logs:', error);
      showAlert('Failed to fetch error logs', 'error');
    }
  };

  // Show alert message
  const showAlert = (message, severity) => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setOpenAlert(true);
    setTimeout(() => {
      setOpenAlert(false);
    }, 5000);
  };

  // Format timestamp to readable format
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Render status indicator
  const renderStatus = () => {
    const color = isError ? 'error.main' : isRunning ? 'primary.main' : 'text.primary';
    
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color, display: 'flex', alignItems: 'center' }}>
          Status: {status}
          {isError && (
            <Button 
              variant="outlined" 
              color="error" 
              size="small" 
              onClick={fetchErrorLogs}
              sx={{ ml: 2 }}
            >
              View Error Log
            </Button>
          )}
        </Typography>
        {isRunning && (
          <Box sx={{ mt: 1 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              Progress: {Math.round(progress)}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  // Render city statistics section
  const renderCityStats = () => {
    if (!selectedCityStats) {
      return (
        <Typography variant="body1" color="text.secondary" sx={{ my: 2 }}>
          Select a city to view statistics
        </Typography>
      );
    }

    return (
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
            <Typography variant="h6" component="div">
              {selectedCityStats.city}
            </Typography>
            <Box>
              <Typography variant="body1" component="span" sx={{ mr: 2 }}>
                <strong>Listings:</strong> {selectedCityStats.listing_count}
              </Typography>
              <Typography variant="body1" component="span">
                <strong>Avg Price/m²:</strong> {selectedCityStats.avg_price_sqm ? `${selectedCityStats.avg_price_sqm} zł` : 'N/A'}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>
            District Statistics by Room Count
          </Typography>
          
          <DistrictRoomsTable 
            districts={selectedCityStats.districts} 
            isLoading={loadingCityStats}
          />
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Collapse in={openAlert}>
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setOpenAlert(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Property Analyzer
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatTimestamp(lastUpdated)}
          </Typography>
        </Box>
      </Paper>
      
      {/* City Selector Dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CitySelector 
          selectedCity={selectedCity} 
          onCityChange={(city) => {
            setSelectedCity(city);
            fetchCityStats(city);
          }} 
        />
        {selectedCity && (
          <Button 
            sx={{ ml: 2 }}
            variant="outlined" 
            size="small"
            onClick={() => {
              setSelectedCity(null);
              setSelectedCityStats(null);
            }}
          >
            Clear Selection
          </Button>
        )}
      </Box>
      
      {!selectedCity ? (
        // Show the city summary table when no city is selected
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>City</TableCell>
                <TableCell align="right">Avg. Price per m² (zł)</TableCell>
                <TableCell align="right">Listing Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cityData.length > 0 ? (
                cityData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell component="th" scope="row">
                      {row.city.charAt(0).toUpperCase() + row.city.slice(1)}
                    </TableCell>
                    <TableCell align="right">{row.avg_price_sqm.toLocaleString()} zł</TableCell>
                    <TableCell align="right">{row.listing_count}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No data available. Start scraping to collect data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        // Show a summary card when a city is selected
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          {loadingCityStats ? (
            <Box display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : selectedCityStats ? (
            <Box>
              <Typography variant="h5" gutterBottom>
                {selectedCityStats.city.charAt(0).toUpperCase() + selectedCityStats.city.slice(1)}
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Listings
                  </Typography>
                  <Typography variant="h6">
                    {selectedCityStats.listing_count}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Price per m²
                  </Typography>
                  <Typography variant="h6">
                    {selectedCityStats.avg_price_sqm ? `${selectedCityStats.avg_price_sqm.toLocaleString()} zł` : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography>No data available for this city.</Typography>
          )}
        </Paper>
      )}
      
      {/* District stats with room data */}
      <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2 }}>
        District Statistics by Room Count
        {selectedCity && ` - ${selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}`}
      </Typography>
      <DistrictRoomsTable selectedCity={selectedCity} />
      
      <Dialog 
        open={openErrorLog} 
        onClose={() => setOpenErrorLog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Error Log</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            variant="outlined"
            value={errorLogContent}
            InputProps={{ readOnly: true }}
            rows={20}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenErrorLog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default OtodomAnalyzer;