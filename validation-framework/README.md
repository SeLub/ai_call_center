# Generic Data Validation and Consistency Framework - Phase 1 & 2 Implementation

## Project Structure

The implementation follows this structure:

```
generic-data-validation-framework/
├── configs/
│   └── rule-templates.json
├── rules/
│   └── validation-rules.json
├── schemas/
│   └── validation-rule-schema.json
├── src/
│   ├── index.js
│   ├── validation-engine.js
│   └── rule-management-api.js
├── package.json
└── README.md
```

## Implementation Steps

### 1. Create Project Structure

Create the directories and files as shown in the structure above.

### 2. Install Dependencies

Run `npm install` to install the required dependencies:
- express: Web framework for Node.js
- ajv: JSON schema validator

### 3. Configure Package.json

The package.json file includes:
- Name and version information
- Entry point (index.js)
- Scripts for starting, testing, and development
- Dependencies and devDependencies

### 4. Implement Core Components

#### Validation Engine (src/validation-engine.js)
- Implements the core validation logic
- Supports multiple rule types (format, range, completeness, uniqueness, crossField, custom)
- Processes datasets against configured rules
- Returns detailed validation results
- **Enhanced with advanced cross-field validation capabilities:**
  - Conditional validation: if one field meets a condition, another field must also meet a condition
  - Comparison validation: compare values between fields (including proper date comparisons)
  - Dependency validation: one field's validity depends on another field
  - Business rule validation: complex business logic across fields
  - Proper date string comparison with automatic conversion to Date objects

#### Rule Management API (src/rule-management-api.js)
- Provides REST endpoints for managing validation rules
- Supports CRUD operations for rules
- Includes rule validation and testing capabilities
- Persists rules to a JSON file

#### Main Application (src/index.js)
- Sets up the Express application
- Implements a health check endpoint
- Provides a validation endpoint
- Starts both the main server and rule management API

### 5. Configure Validation Rules

#### Schema Definition (schemas/validation-rule-schema.json)
- Defines the structure for validation rules
- Supports different rule types and configurations
- Includes validation for rule properties

#### Rule Templates (configs/rule-templates.json)
- Provides example rule templates for common validation scenarios
- Includes templates for email, phone, age, required fields, and unique IDs

#### Rules Storage (rules/validation-rules.json)
- Stores the actual validation rules used by the system
- Initially empty, populated through the API

## Advanced Cross-Field Validation Capabilities

The framework now supports advanced cross-field validation rules that can check dependencies and relationships between different fields in a dataset. This enables complex business logic validation that goes beyond simple field-level validation.

### Types of Cross-Field Validation

#### 1. Conditional Validation
Checks if one field meets a condition, then applies validation to another field.

#### 2. Comparison Validation
Compares values between two fields using various operators, with proper handling of dates and numbers.

#### 3. Dependency Validation
Validates that if one field has a specific value, another field must be present.

#### 4. Business Rule Validation
Complex business logic validation that implements specific business requirements like:
- Email or phone requirement (at least one contact method)
- Minors consent validation (under 18 need guardian consent)
- Salary verification (high salaries need verification and employment status)
- Date range validation (start date before end date)

## Usage

### Starting the Application

1. Install dependencies: `npm install`
2. Start the application: `npm start`
3. The main server will listen on port 3001
4. The rule management API will listen on port 3002

### Using the API

#### Health Check
- Endpoint: `GET /health`
- Response: `{ status: 'OK', timestamp: 'ISO timestamp' }`

#### Validate Data
- Endpoint: `POST /validate`
- Request Body: `{ data: { /* data to validate */ } }`
- Response: Validation results including passed/failed validations and summary

#### Manage Rules
- Get all rules: `GET /api/rules`
- Get a specific rule: `GET /api/rules/:id`
- Create a new rule: `POST /api/rules`
- Update an existing rule: `PUT /api/rules/:id`
- Delete a rule: `DELETE /api/rules/:id`
- Test a rule: `POST /api/rules/:id/test`
- Validate rule structure: `POST /api/rules/validate`

### Example Validation Rule

```json
{
  "id": "email-format",
  "name": "Email Format Validation",
  "description": "Validates that a field contains a properly formatted email address",
  "ruleType": "format",
  "target": {
    "field": "*email*"
 },
  "configuration": {
    "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    "dataType": "email"
  }
}
```

## Testing

Run tests using `npm test`. The framework uses Jest for testing.

To run the cross-field validation tests specifically:
`node test-cross-field.js`

## Extending the Framework

The framework is designed to be extensible:

1. Add new rule types by extending the validation engine
2. Create custom validation functions for specific business rules
3. Extend the rule management API with additional endpoints
4. Implement alternative storage mechanisms for rules

## Security Considerations

When deploying this framework in production:

1. Add authentication and authorization to the APIs
2. Implement rate limiting to prevent abuse
3. Validate and sanitize all inputs
4. Use HTTPS for all communications
5. Regularly update dependencies to address security vulnerabilities

## Performance Considerations

For high-performance scenarios:

1. Consider using a database instead of JSON files for rule storage
2. Implement caching for frequently used rules
3. Use streaming for large dataset validation
4. Implement parallel processing for independent validations