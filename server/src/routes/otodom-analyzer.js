const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../otodom.db');
const LOG_PATH = path.resolve(process.cwd(), 'parser_errors.log');

// Script paths
const SCRIPT_DIR = path.resolve(__dirname, '../otodom_parser');
const SCRIPT = path.join(__dirname, '../otodom_parser/run_scraper.py');

// Scraper process state
let scraperProcess = null;
let scraperStatus = {
  status: "Ready",
  progress: 0,
  error: false,
  lastStarted: null,
  isRunning: false
};

// Function to read error logs
function readErrorLogs() {
  try {
    if (fs.existsSync(LOG_PATH)) {
      return fs.readFileSync(LOG_PATH, 'utf8').split('\n').slice(-100).join('\n'); // Last 100 lines
    }
    return '';
  } catch (error) {
    console.error('Error reading log file:', error);
    return 'Error reading log file';
  }
}

// Start the scraper
router.post('/start-scrape', (req, res) => {
  if (scraperProcess && scraperStatus.isRunning) {
    return res.status(400).json({ error: 'Scraper is already running' });
  }

  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(SCRIPT_DIR)) {
      fs.mkdirSync(SCRIPT_DIR, { recursive: true });
    }

    // Start the scraper process
    scraperProcess = spawn('python', [SCRIPT], { env: { ...process.env } });
    scraperStatus = {
      status: "Starting...",
      progress: 0,
      error: false,
      lastStarted: new Date().toISOString(),
      isRunning: true
    };

    scraperProcess.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Parse status updates
      if (output.includes('STATUS:')) {
        const statusMatch = output.match(/STATUS: (.+)/);
        if (statusMatch) {
          scraperStatus.status = statusMatch[1];
        }
      }
      
      if (output.includes('PROGRESS:')) {
        const progressMatch = output.match(/PROGRESS: ([0-9.]+)/);
        if (progressMatch) {
          scraperStatus.progress = parseFloat(progressMatch[1]);
        }
      }
      
      if (output.includes('ERROR:')) {
        const errorMatch = output.match(/ERROR: ([01])/);
        if (errorMatch) {
          scraperStatus.error = errorMatch[1] === '1';
        }
      }
      
      console.log(`Scraper output: ${output}`);
    });

    scraperProcess.stderr.on('data', (data) => {
      console.error(`Scraper error: ${data}`);
      scraperStatus.error = true;
    });

    scraperProcess.on('close', (code) => {
      console.log(`Scraper process exited with code ${code}`);
      scraperStatus.isRunning = false;
      
      if (code !== 0) {
        scraperStatus.error = true;
        scraperStatus.status = "Failed - see log";
      } else if (!scraperStatus.error) {
        scraperStatus.status = "Completed";
      } else {
        scraperStatus.status = "Completed with errors - see log";
      }
      
      scraperProcess = null;
    });

    return res.json({ message: 'Scraper started', status: scraperStatus });
  } catch (error) {
    console.error('Failed to start scraper:', error);
    return res.status(500).json({ error: 'Failed to start scraper' });
  }
});

// Get scraper status
router.get('/status', (req, res) => {
  res.json(scraperStatus);
});

// Get scraped data
router.get('/data', (req, res) => {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to connect to database' });
    }

    const query = `
      SELECT city,
             ROUND(AVG(price_per_sqm), 0) AS avg_price_sqm,
             COUNT(*) AS listing_count
      FROM listings
      GROUP BY city
      ORDER BY avg_price_sqm DESC
    `;
    
    db.all(query, [], (err, rows) => {
      db.close();
      
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Failed to query database' });
      }
      
      res.json(rows);
    });
  });
});

// Get district data with room aggregation
router.get('/district-rooms', (req, res) => {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to connect to database' });
    }

    // First get all districts with their stats
    const query = `
      SELECT 
        city,
        district,
        ROUND(AVG(price_per_sqm), 0) AS avg_ppsqm,
        COUNT(*) AS count
      FROM listings
      GROUP BY city, district
      ORDER BY avg_ppsqm DESC
    `;
    
    db.all(query, [], (err, districts) => {
      if (err) {
        console.error(err.message);
        db.close();
        return res.status(500).json({ error: 'Failed to query database for districts' });
      }
      
      // Now get rooms data for each district
      const roomQuery = `
        SELECT 
          city,
          district,
          CASE 
            WHEN rooms >= 3 THEN '3+'
            WHEN rooms = 2 THEN '2'
            WHEN rooms = 1 THEN '1'
            ELSE 'unknown'
          END AS room_category,
          ROUND(AVG(price_per_sqm), 0) AS avg_ppsqm,
          COUNT(*) AS count
        FROM listings
        WHERE rooms IS NOT NULL
        GROUP BY city, district, room_category
      `;
      
      db.all(roomQuery, [], (err, roomStats) => {
        db.close();
        
        if (err) {
          console.error(err.message);
          return res.status(500).json({ error: 'Failed to query database for room stats' });
        }
        
        // Merge room stats with district data
        const result = districts.map(district => {
          // Match rooms by both city and district to avoid mixing data from different cities
          const districtRooms = roomStats.filter(r => 
            r.district === district.district && r.city === district.city
          );
          
          const rooms = {};
          districtRooms.forEach(room => {
            if (room.room_category !== 'unknown') {
              rooms[room.room_category] = {
                avg_ppsqm: room.avg_ppsqm,
                count: room.count
              };
            }
          });
          
          return {
            city: district.city, // Include city in the result
            district: district.district,
            avg_ppsqm: district.avg_ppsqm,
            count: district.count,
            rooms: rooms
          };
        });
        
        res.json(result);
      });
    });
  });
});

// Get last updated timestamp
router.get('/last-updated', (req, res) => {
  const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to connect to database' });
    }

    const query = 'SELECT MAX(scraped_at) as last_updated FROM listings';
    
    db.get(query, [], (err, row) => {
      db.close();
      
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: 'Failed to query database' });
      }
      
      res.json({ lastUpdated: row.last_updated });
    });
  });
});

// Get error logs
router.get('/error-logs', (req, res) => {
  const logs = readErrorLogs();
  res.json({ logs });
});

module.exports = router;