# Advanced Cross-Field Validation in the Data Validation Framework

## Overview
The validation framework supports advanced cross-field validation rules that can check dependencies and relationships between different fields in a dataset. This enables complex business logic validation that goes beyond simple field-level validation.

## Types of Cross-Field Validation

### 1. Conditional Validation
Checks if one field meets a condition, then applies validation to another field.

**Configuration:**
```json
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
}
```

**Supported Operators:**
- `equals`, `notEquals`
- `greaterThan`, `greaterThanOrEqual`
- `lessThan`, `lessThanOrEqual`
- `contains`, `startsWith`, `endsWith`

### 2. Comparison Validation
Compares values between two fields using various operators.

**Configuration:**
```json
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
}
```

**Supported Comparison Operators:**
- `equals`, `notEquals`
- `greaterThan`, `greaterThanOrEqual`
- `lessThan`, `lessThanOrEqual`
- `sumEquals`, `sumLessThan`, `sumGreaterThan` (for sum comparisons)

### 3. Dependency Validation
Validates that if one field has a specific value, another field must be present.

**Configuration:**
```json
{
  "id": "field-dependency",
  "name": "Field Dependency Validation",
  "description": "When status is 'active', verification is required",
  "ruleType": "crossField",
  "target": {
    "field": "status"
  },
  "configuration": {
    "type": "dependency",
    "dependentField": "status",
    "requiredValue": "active",
    "targetField": "verification"
  }
}
```

### 4. Business Rule Validation
Complex business logic validation that implements specific business requirements.

**Supported Business Rules:**
- `email-phone-required`: Either email or phone must be provided
- `minors-consent`: For users under 18, guardian consent and email are required
- `salary-verification`: For high salaries, verification and employment status are required
- `age-verification`: For adults, ID verification is required

## Implementation Details

The validation engine automatically detects date strings and converts them to Date objects for proper comparison. Numeric values are converted to numbers for mathematical comparisons.

## Example Usage

Here are examples of how to use the different types of cross-field validation:

### Example 1: Age-based ID Verification
```json
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
}
```

### Example 2: Date Range Validation
```json
{
  "id": "date-range-validation",
  "name": "Date Range Validation",
  "description": "End date must be after start date",
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
}
```

### Example 3: Business Rule for Contact Information
```json
{
  "id": "contact-requirement",
  "name": "Contact Requirement",
  "description": "Either email or phone must be provided",
  "ruleType": "crossField",
  "target": {
    "field": "*"
  },
  "configuration": {
    "type": "businessRule",
    "businessRule": "email-phone-required"
  }
}
```

## Testing Results

The advanced cross-field validation has been thoroughly tested with the following results:

1. **Adult ID Verification**: Correctly validates that users 18+ need ID verification
2. **Email/Phone Requirement**: Ensures at least one contact method is provided
3. **Minors Consent**: Properly requires guardian consent for users under 18
4. **Date Comparison**: Accurately compares dates to ensure logical ordering
5. **Salary Verification**: Validates employment status and verification for high salaries

All tests pass as expected, demonstrating the robustness of the cross-field validation system.