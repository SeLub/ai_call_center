// Import required modules
const express = require('express');
const ValidationEngine = require('./src/validation-engine');
const fs = require('fs').promises;
const path = require('path');

// Create Express app
const app = express();
app.use(express.json());

// Create a validation engine instance
const validationEngine = new ValidationEngine();

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint for validating data
app.post('/validate', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required for validation' });
    }
    
    // Load rules from the validation-rules.json file
    const rulesFilePath = path.join(__dirname, './rules/validation-rules.json');
    let rules = [];
    
    try {
      const rulesData = await fs.readFile(rulesFilePath, 'utf8');
      const parsedRules = JSON.parse(rulesData);
      rules = parsedRules.rules || [];
    } catch (error) {
      console.error('Error loading rules:', error.message);
      // If file doesn't exist or is invalid, continue with empty rules array
      rules = [];
    }
    
    // Load rules into validation engine
    validationEngine.loadRules(rules);
    
    // Validate the data
    const results = validationEngine.validate(data);
    
    // Separate passed and failed validations
    const passed = results.filter(r => r.passed);
    const failed = results.filter(r => !r.passed);
    
    res.json({
      valid: failed.length === 0,
      passed,
      failed,
      summary: {
        total: results.length,
        passed: passed.length,
        failed: failed.length
      }
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3003; // Use a different port to avoid conflicts
app.listen(PORT, () => {
  console.log(`Test Validation Server listening on port ${PORT}`);
});