# Validation Rule Management UI

The Validation Rule Management UI provides a web-based interface for managing validation rules in the Generic Data Validation Framework. This interface allows users to create, edit, delete, and test validation rules without directly interacting with the API.

## Features

- **View Rules**: See all configured validation rules with their details
- **Add Rules**: Create new validation rules with a user-friendly form
- **Edit Rules**: Modify existing validation rules
- **Delete Rules**: Remove validation rules that are no longer needed
- **Test Rules**: Test validation rules with sample data
- **Search Rules**: Find specific rules using the search functionality
- **Rule Details**: View comprehensive configuration details for each rule

## Rule Types Supported

The UI supports all validation rule types implemented in the framework:

1. **Format Rules**: Validate data format using regular expressions or predefined data types
2. **Range Rules**: Validate numeric values within specified ranges
3. **Completeness Rules**: Ensure required fields are present and not empty
4. **Uniqueness Rules**: Ensure values are unique within a collection
5. **Cross-Field Rules**: Validate relationships between different fields
6. **Custom Rules**: Execute custom validation functions

## Cross-Field Validation Types

The UI provides specialized forms for different cross-field validation types:

- **Conditional**: If one field meets a condition, another field must also meet a condition
- **Comparison**: Compare values between two fields
- **Dependency**: One field's validity depends on another field
- **Business Rule**: Complex business logic validation

## Running the UI

### Prerequisites

- Node.js installed
- Validation Framework Rule Management API running on port 304

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Make sure the validation framework is running:
   ```bash
   npm start
   ```
   This will start the main validation API on port 3003 and the rule management API on port 3004.

### Starting the UI

Start the UI server:
```bash
npm run ui
```

The UI will be available at `http://localhost:3005`.

### Using the UI

1. Open your browser and navigate to `http://localhost:3005`
2. Click "Load Rules" to retrieve the current validation rules
3. Use the "Add New Rule" button to create new rules
4. Use the search box to filter rules by name, description, or target field
5. Use the action buttons (Edit, Delete, Test) to manage individual rules

## API Proxy

The UI server acts as a proxy to the rule management API, forwarding requests from the UI to the actual API endpoint. This allows the UI to work without CORS issues and provides a unified interface. When the UI makes a request to `/api/rules`, the proxy forwards it to the rule management API at `http://localhost:3004/api/rules`.

## Security Considerations

For production use, consider adding:
- Authentication and authorization
- HTTPS encryption
- Rate limiting
- Input validation

## Troubleshooting

- Make sure the rule management API is running on port 3004
- Check browser console for JavaScript errors
- Verify network requests in browser developer tools
- Check UI server logs for proxy errors