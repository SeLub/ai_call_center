/**
 * Rule Management API
 * Provides endpoints for managing validation rules
 */

const express = require('express');
const ValidationEngine = require('./validation-engine');
const fs = require('fs').promises;
const path = require('path');

class RuleManagementAPI {
  constructor() {
    this.app = express();
    this.app.use(express.json());
    
    this.validationEngine = new ValidationEngine();
    this.rulesFilePath = path.join(__dirname, '../rules/validation-rules.json');
    
    this.setupRoutes();
  }
  
  setupRoutes() {
    // Get all rules
    this.app.get('/api/rules', async (req, res) => {
      try {
        const rules = await this.loadRules();
        res.json({ rules });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get a specific rule
    this.app.get('/api/rules/:id', async (req, res) => {
      try {
        const rules = await this.loadRules();
        const rule = rules.find(r => r.id === req.params.id);
        
        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        
        res.json({ rule });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Create a new rule
    this.app.post('/api/rules', async (req, res) => {
      try {
        const newRule = req.body;
        
        // Validate the rule structure
        if (!this.validateRuleStructure(newRule)) {
          return res.status(400).json({ error: 'Invalid rule structure' });
        }
        
        // Load existing rules
        const rules = await this.loadRules();
        
        // Check if rule with this ID already exists
        if (rules.some(r => r.id === newRule.id)) {
          return res.status(409).json({ error: 'Rule with this ID already exists' });
        }
        
        // Add the new rule
        rules.push(newRule);
        
        // Save rules
        await this.saveRules(rules);
        
        res.status(201).json({ rule: newRule });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Update an existing rule
    this.app.put('/api/rules/:id', async (req, res) => {
      try {
        const updatedRule = req.body;
        const ruleId = req.params.id;
        
        // Validate the rule structure
        if (!this.validateRuleStructure(updatedRule)) {
          return res.status(400).json({ error: 'Invalid rule structure' });
        }
        
        // Ensure the ID in the body matches the URL parameter
        if (updatedRule.id !== ruleId) {
          return res.status(400).json({ error: 'Rule ID in body does not match URL parameter' });
        }
        
        // Load existing rules
        const rules = await this.loadRules();
        
        // Find the index of the rule to update
        const ruleIndex = rules.findIndex(r => r.id === ruleId);
        
        if (ruleIndex === -1) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        
        // Update the rule
        rules[ruleIndex] = updatedRule;
        
        // Save rules
        await this.saveRules(rules);
        
        res.json({ rule: updatedRule });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Delete a rule
    this.app.delete('/api/rules/:id', async (req, res) => {
      try {
        const ruleId = req.params.id;
        
        // Load existing rules
        const rules = await this.loadRules();
        
        // Filter out the rule to delete
        const filteredRules = rules.filter(r => r.id !== ruleId);
        
        // Check if a rule was actually removed
        if (filteredRules.length === rules.length) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        
        // Save rules
        await this.saveRules(filteredRules);
        
        res.status(204).send();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Test a rule against sample data
    this.app.post('/api/rules/:id/test', async (req, res) => {
      try {
        const ruleId = req.params.id;
        const testData = req.body.testData;
        
        if (!testData) {
          return res.status(400).json({ error: 'Test data is required' });
        }
        
        // Load the specific rule
        const rules = await this.loadRules();
        const rule = rules.find(r => r.id === ruleId);
        
        if (!rule) {
          return res.status(404).json({ error: 'Rule not found' });
        }
        
        // Create a temporary validation engine and test only this rule
        const tempEngine = new ValidationEngine();
        tempEngine.loadRules([rule]); // Load only the specific rule
        const results = tempEngine.validate(testData);
        
        res.json({ results });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Validate rule structure
    this.app.post('/api/rules/validate', (req, res) => {
      try {
        const rule = req.body.rule;
        
        if (!rule) {
          return res.status(400).json({ error: 'Rule definition is required' });
        }
        
        const isValid = this.validateRuleStructure(rule);
        
        res.json({ valid: isValid });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
 }
  
  /**
   * Load validation rules from file
   * @returns {Promise<Array>} Array of rule definitions
   */
  async loadRules() {
    try {
      const data = await fs.readFile(this.rulesFilePath, 'utf8');
      const rulesData = JSON.parse(data);
      return rulesData.rules || [];
    } catch (error) {
      // If file doesn't exist or is invalid, return empty array
      return [];
    }
  }
  
  /**
   * Save validation rules to file
   * @param {Array} rules - Array of rule definitions
   */
  async saveRules(rules) {
    const rulesData = { rules };
    await fs.writeFile(this.rulesFilePath, JSON.stringify(rulesData, null, 2));
  }
  
  /**
   * Validate rule structure against schema
   * @param {Object} rule - Rule definition to validate
   * @returns {Boolean} Whether the rule structure is valid
   */
  validateRuleStructure(rule) {
    // Basic validation - in a real implementation, this would use a JSON schema validator
    if (!rule.id || !rule.name || !rule.ruleType || !rule.target) {
      return false;
    }
    
    if (!rule.target.field) {
      return false;
    }
    
    // Validate rule type is one of the supported types
    const validRuleTypes = ['format', 'range', 'completeness', 'uniqueness', 'crossField', 'custom'];
    if (!validRuleTypes.includes(rule.ruleType)) {
      return false;
    }
    
    return true;
 }
  
  /**
   * Start the API server
   * @param {Number} port - Port to listen on
   */
  start(port = 3002) {
    this.app.listen(port, () => {
      console.log(`Rule Management API listening on port ${port}`);
    });
  }
}

module.exports = RuleManagementAPI;