const ValidationEngine = require('./src/validation-engine');

async function testValidationEngineDirectly() {
  console.log('Testing Validation Engine directly...\n');
  
  // Create a validation engine instance
  const engine = new ValidationEngine();
  
  // Define some test rules
  const testRules = [
    {
      id: "email-format",
      name: "Email Format Validation",
      description: "Validates that a field contains a properly formatted email address",
      ruleType: "format",
      target: {
        field: "*email*"
      },
      configuration: {
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
        dataType: "email"
      }
    },
    {
      id: "age-range",
      name: "Age Range Validation",
      description: "Validates that an age field is within a reasonable range",
      ruleType: "range",
      target: {
        field: "*age*"
      },
      configuration: {
        min: 0,
        max: 150
      }
    },
    {
      id: "required-field",
      name: "Required Field Validation",
      description: "Ensures that a field is present and not empty",
      ruleType: "completeness",
      target: {
        field: "*"
      },
      configuration: {
        required: true,
        notEmpty: true
      }
    }
  ];
  
  // Load rules into the engine
  engine.loadRules(testRules);
  
  // Test with valid data
 console.log('1. Testing with valid data:');
  const validData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    age: 30
  };
  
  let results = engine.validate(validData);
  console.log('Validation results for valid data:', JSON.stringify(results, null, 2));
  
  // Test with invalid data
 console.log('\n2. Testing with invalid data:');
  const invalidData = {
    name: '', // Empty required field
    email: 'invalid-email', // Invalid email format
    age: 200 // Age out of range
  };
  
  results = engine.validate(invalidData);
  console.log('Validation results for invalid data:', JSON.stringify(results, null, 2));
  
  // Test with more validation rule types
  console.log('\n3. Testing with additional rule types:');
  
  // Add a uniqueness rule to the test rules
 testRules.push({
    id: "unique-id",
    name: "Unique ID Validation",
    description: "Ensures that an identifier field is unique",
    ruleType: "uniqueness",
    target: {
      field: "*id"
    },
    configuration: {
      scope: "collection"
    }
  });
  
  // Reload rules with the new one
  engine.loadRules(testRules);
  
  const uniquenessData = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  };
  
  results = engine.validate(uniquenessData);
  console.log('Validation results with uniqueness check:', JSON.stringify(results, null, 2));
  
  console.log('\nDirect validation engine tests completed!');
}

// Run the direct tests
testValidationEngineDirectly();