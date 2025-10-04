const axios = require('axios');

// Base URLs for the validation framework
const MAIN_SERVER_URL = 'http://localhost:3001';
const RULE_API_URL = 'http://localhost:3002';

async function testValidationFramework() {
  console.log('Testing Validation Framework...\n');
  
  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${MAIN_SERVER_URL}/health`);
    console.log('Health check:', healthResponse.data);
    
    // 2. Test data validation with valid data first
    console.log('\n2. Testing validation with valid data...');
    const validData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30
    };
    
    const validResponse = await axios.post(`${MAIN_SERVER_URL}/validate`, {
      data: validData
    });
    console.log('Validation result for valid data:', validResponse.data);
    
    // 3. Test data validation with invalid data
    console.log('\n3. Testing validation with invalid data...');
    const invalidData = {
      name: '', // Empty required field
      email: 'invalid-email', // Invalid email format
      age: 200 // Age out of range
    };
    
    const invalidResponse = await axios.post(`${MAIN_SERVER_URL}/validate`, {
      data: invalidData
    });
    console.log('Validation result for invalid data:', invalidResponse.data);
    
    // 4. Try to access the rule management API
    console.log('\n4. Testing rule management API...');
    try {
      const rulesResponse = await axios.get(`${RULE_API_URL}/api/rules`);
      console.log('Rules from API:', rulesResponse.data);
    } catch (ruleError) {
      console.log('Rule management API not accessible:', ruleError.message);
      console.log('This might be because the rule management API is not running on port 3002');
      console.log('The main validation server is running on port 3001');
    }
    
    // 5. Test validation with just the rules that are already in the file
    console.log('\n5. Testing validation with rules loaded from validation-rules.json...');
    const testData = {
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      age: 25
    };
    
    const response = await axios.post(`${MAIN_SERVER_URL}/validate`, {
      data: testData
    });
    console.log('Validation result with pre-loaded rules:', response.data);
    
    // 6. Test validation with data that should fail
    console.log('\n6. Testing validation with data that should fail certain rules...');
    const failingData = {
      name: '',
      email: 'invalid-email-format',
      age: 200
    };
    
    const failingResponse = await axios.post(`${MAIN_SERVER_URL}/validate`, {
      data: failingData
    });
    console.log('Validation result for failing data:', failingResponse.data);
    
    console.log('\nTesting completed!');
  } catch (error) {
    console.error('General error during testing:', error.message);
    if (error.response) {
      console.error('Response error:', error.response.data);
    }
  }
}

// Run the tests
testValidationFramework();