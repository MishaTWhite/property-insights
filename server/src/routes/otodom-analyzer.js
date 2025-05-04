const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const router = express.Router();
const DB_PATH = path.join(__dirname, '../otodom_parser/otodom.db');
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
        district_parent,
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
        
        // Use district_parent field instead of extracting from district name
        const districtsWithParent = districts.map(district => {
          // Use district_parent field directly, or fallback to district if parent is not available
          let parentDistrict = district.district_parent || district.district;
          
          // Process rooms data for this district
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
            city: district.city,
            district: district.district,
            parentDistrict: parentDistrict,
            avg_ppsqm: district.avg_ppsqm,
            count: district.count,
            rooms: rooms
          };
        });
        
        // Group by parent district
        const parentDistrictMap = {};
        districtsWithParent.forEach(district => {
          const parentKey = `${district.city}|${district.parentDistrict}`;
          
          if (!parentDistrictMap[parentKey]) {
            parentDistrictMap[parentKey] = {
              city: district.city,
              district: district.parentDistrict, // Use parent district name as district
              avg_ppsqm: 0,
              count: 0,
              rooms: { "1": {count: 0, avg_ppsqm: 0}, "2": {count: 0, avg_ppsqm: 0}, "3+": {count: 0, avg_ppsqm: 0} },
              childDistricts: []
            };
          }
          
          const parent = parentDistrictMap[parentKey];
          
          // Add this district to the parent's children
          parent.childDistricts.push({
            district: district.district,
            avg_ppsqm: district.avg_ppsqm,
            count: district.count,
            rooms: district.rooms
          });
          
          // Update parent district aggregates
          parent.count += district.count;
          
          // Calculate weighted average price per square meter
          parent.avg_ppsqm = Math.round(
            (parent.avg_ppsqm * (parent.count - district.count) + district.avg_ppsqm * district.count) / parent.count
          );
          
          // Aggregate room counts and prices
          for (const roomType in district.rooms) {
            if (!parent.rooms[roomType]) {
              parent.rooms[roomType] = { count: 0, avg_ppsqm: 0 };
            }
            
            const parentRoom = parent.rooms[roomType];
            const districtRoom = district.rooms[roomType];
            
            // Calculate weighted average for room prices
            if (districtRoom && districtRoom.count) {
              const newCount = parentRoom.count + districtRoom.count;
              parentRoom.avg_ppsqm = Math.round(
                (parentRoom.avg_ppsqm * parentRoom.count + districtRoom.avg_ppsqm * districtRoom.count) / 
                (newCount || 1) // Avoid division by zero
              );
              parentRoom.count = newCount;
            }
          }
        });
        
        // Convert to array and sort by price
        const result = Object.values(parentDistrictMap);
        result.sort((a, b) => b.avg_ppsqm - a.avg_ppsqm);
        
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