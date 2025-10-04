// Import required modules
const express = require('express');
const RuleManagementAPI = require('./rule-management-api');
const ValidationEngine = require('./validation-engine');

// Create Express app
const app = express();
app.use(express.json());

// Create instances of our classes
const ruleManagementAPI = new RuleManagementAPI();
const validationEngine = new ValidationEngine();

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Example endpoint for validating data
app.post('/validate', async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required for validation' });
    }
    
    // Load rules
    const rules = await ruleManagementAPI.loadRules();
    
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
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Generic Data Validation Framework listening on port ${PORT}`);
  
  // Also start the rule management API
  ruleManagementAPI.start(3002);
});