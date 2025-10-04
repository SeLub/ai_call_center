const ValidationEngine = require('./src/validation-engine');

async function testCrossFieldValidation() {
  console.log('Testing Advanced Cross-Field Validation...\n');
  
  // Create a validation engine instance
  const engine = new ValidationEngine();
  
  // Define advanced cross-field validation rules
  const crossFieldRules = [
    {
      "id": "adult-id-verification",
      "name": "Adult ID Verification",
      "description": "When age is 18 or above, ID verification is required",
      "ruleType": "crossField",
      "target": {
        "field": "age"
      },
      "configuration": {
        "type": "conditional",
        "conditionField": "age",
        "conditionValue": 18,
        "conditionOperator": "greaterThanOrEqual",
        "targetField": "idVerification",
        "targetCondition": {
          "type": "required",
          "message": "ID verification is required for adults (18+)"
        }
      }
    },
    {
      "id": "email-or-phone-required",
      "name": "Email or Phone Required",
      "description": "Either email or phone must be provided",
      "ruleType": "crossField",
      "target": {
        "field": "*"
      },
      "configuration": {
        "type": "businessRule",
        "businessRule": "email-phone-required"
      }
    },
    {
      "id": "minors-consent",
      "name": "Minors Consent Validation",
      "description": "For users under 18, guardian consent and email are required",
      "ruleType": "crossField",
      "target": {
        "field": "age"
      },
      "configuration": {
        "type": "businessRule",
        "businessRule": "minors-consent"
      }
    },
    {
      "id": "date-comparison",
      "name": "Date Comparison Validation",
      "description": "Start date must be before end date",
      "ruleType": "crossField",
      "target": {
        "field": "startDate"
      },
      "configuration": {
        "type": "comparison",
        "field1": "startDate",
        "field2": "endDate",
        "comparisonOperator": "lessThan"
      }
    },
    {
      "id": "salary-verification",
      "name": "High Salary Verification",
      "description": "For salaries above 10,000, verification is required",
      "ruleType": "crossField",
      "target": {
        "field": "salary"
      },
      "configuration": {
        "type": "businessRule",
        "businessRule": "salary-verification"
      }
    }
  ];
  
  // Load rules into the engine
  engine.loadRules(crossFieldRules);
  
  // Test 1: Adult without ID verification (should fail)
  console.log('1. Testing adult without ID verification (should fail):');
  const adultWithoutId = {
    name: 'John Doe',
    age: 25,
    email: 'john@example.com'
    // Missing idVerification
  };
  
  let results = engine.validate(adultWithoutId);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 2: Adult with ID verification (should pass)
  console.log('\n2. Testing adult with ID verification (should pass):');
  const adultWithId = {
    name: 'John Doe',
    age: 25,
    email: 'john@example.com',
    idVerification: 'verified'
  };
  
 results = engine.validate(adultWithId);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 3: No email or phone provided (should fail)
  console.log('\n3. Testing no email or phone provided (should fail):');
  const noContact = {
    name: 'Jane Doe',
    age: 30
    // Missing both email and phone
  };
  
  results = engine.validate(noContact);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 4: Email provided (should pass)
 console.log('\n4. Testing with email provided (should pass):');
  const withEmail = {
    name: 'Jane Doe',
    age: 30,
    email: 'jane@example.com'
  };
  
  results = engine.validate(withEmail);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 5: Minor without guardian consent (should fail)
  console.log('\n5. Testing minor without guardian consent (should fail):');
  const minorWithoutConsent = {
    name: 'Child Doe',
    age: 15,
    email: 'child@example.com'
    // Missing guardianConsent and guardianEmail
  };
  
  results = engine.validate(minorWithoutConsent);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 6: Minor with guardian consent (should pass)
  console.log('\n6. Testing minor with guardian consent (should pass):');
  const minorWithConsent = {
    name: 'Child Doe',
    age: 15,
    email: 'child@example.com',
    guardianConsent: true,
    guardianEmail: 'parent@example.com'
  };
  
  results = engine.validate(minorWithConsent);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 7: Invalid date comparison (should fail)
  console.log('\n7. Testing invalid date comparison (should fail):');
  const invalidDates = {
    name: 'John Doe',
    startDate: '2023-12-31',
    endDate: '2023-01-01',  // End date before start date
    email: 'john@example.com'
  };
  
  results = engine.validate(invalidDates);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 8: Valid date comparison (should pass)
  console.log('\n8. Testing valid date comparison (should pass):');
  const validDates = {
    name: 'John Doe',
    startDate: '2023-01-01',
    endDate: '2023-12-31',  // End date after start date
    email: 'john@example.com'
  };
  
  results = engine.validate(validDates);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 9: High salary without verification (should fail)
  console.log('\n9. Testing high salary without verification (should fail):');
  const highSalaryWithoutVerification = {
    name: 'Executive Doe',
    salary: 150000,  // High salary requires verification
    email: 'exec@example.com',
    employmentStatus: 'employed'  // Adding employment status
    // Missing salaryVerification
  };
  
  results = engine.validate(highSalaryWithoutVerification);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 10: High salary with verification (should pass)
  console.log('\n10. Testing high salary with verification (should pass):');
  const highSalaryWithVerification = {
    name: 'Executive Doe',
    salary: 15000,
    email: 'exec@example.com',
    salaryVerification: 'verified',
    employmentStatus: 'employed'
 };
  
  results = engine.validate(highSalaryWithVerification);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 11: Regular salary with valid employment status (should pass)
  console.log('\n11. Testing regular salary with valid employment status (should pass):');
  const regularSalary = {
    name: 'Regular Employee',
    salary: 50000, // Regular salary, below threshold
    email: 'regular@example.com',
    employmentStatus: 'employed'
  };
  
  results = engine.validate(regularSalary);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  // Test 12: Regular salary without employment status (should fail)
  console.log('\n12. Testing regular salary without employment status (should fail):');
  const salaryWithoutStatus = {
    name: 'Regular Employee',
    salary: 50000,  // Regular salary, but no employment status
    email: 'regular@example.com'
    // Missing employmentStatus
  };
  
  results = engine.validate(salaryWithoutStatus);
  console.log('Validation results:', JSON.stringify(results, null, 2));
  
  console.log('\nAdvanced cross-field validation tests completed!');
}

// Run the cross-field validation tests
testCrossFieldValidation();