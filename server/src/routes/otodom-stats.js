const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Execute a Python function and return its result
const executePythonFunction = (functionName, args = []) => {
  return new Promise((resolve, reject) => {
    // Create a script that imports the db module and calls the requested function
    const pythonCode = `
import sys
import json
sys.path.append('${path.resolve(__dirname, '../otodom_parser')}')
import db

try:
    result = db.${functionName}(${args.map(arg => JSON.stringify(arg)).join(', ')})
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
`;

    const pythonProcess = spawn('python', ['-c', pythonCode]);
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
      }

      try {
        const result = JSON.parse(outputData);
        if (result && result.error) {
          return reject(new Error(result.error));
        }
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });
  });
};

// Get all cities endpoint
router.get('/cities', async (req, res) => {
  try {
    const cities = await executePythonFunction('get_all_cities');
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get stats for a specific city
router.get('/stats', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    const stats = await executePythonFunction('get_city_stats', [city]);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching city stats:', error);
    res.status(500).json({ error: 'Failed to fetch city stats' });
  }
});

module.exports = router;