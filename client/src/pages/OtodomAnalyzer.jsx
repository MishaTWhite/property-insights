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
  TextField
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import DistrictRoomsTable from '../components/DistrictRoomsTable';

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function OtodomAnalyzer() {
  // State management
  const [status, setStatus] = useState('Ready');
  const [progress, setProgress] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [cityData, setCityData] = useState([]);
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

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Collapse in={openAlert}>
        <Alert severity={alertSeverity} sx={{ mb: 2 }} onClose={() => setOpenAlert(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      
      <Typography variant="h4" component="h1" gutterBottom>
        Otodom Analyzer
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        {renderStatus()}
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={startScraper}
            disabled={isRunning}
          >
            Start Scraping
          </Button>
          
          <Typography variant="body2" color="text.secondary">
            Last updated: {formatTimestamp(lastUpdated)}
          </Typography>
        </Box>
      </Paper>
      
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
      
      {/* District stats with room data */}
      <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2 }}>
        District Statistics by Room Count
      </Typography>
      <DistrictRoomsTable />
      
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