/**
 * Generic Validation Engine
 * Processes datasets against configured validation rules
 */

class ValidationEngine {
  constructor() {
    this.rules = [];
    this.results = [];
  }

  /**
   * Load validation rules from configuration
   * @param {Array} rules - Array of rule definitions
   */
  loadRules(rules) {
    this.rules = rules;
 }

  /**
   * Validate a dataset against loaded rules
   * @param {Object} dataset - Dataset to validate
   * @returns {Array} Validation results
   */
  validate(dataset) {
    this.results = [];
    
    // Process each rule against the dataset
    for (const rule of this.rules) {
      if (rule.enabled !== false) {
        this.applyRule(rule, dataset);
      }
    }
    
    return this.results;
  }

  /**
   * Apply a specific rule to the dataset
   * @param {Object} rule - Rule definition
   * @param {Object} dataset - Dataset to validate
   */
  applyRule(rule, dataset) {
    // Find fields that match the rule target
    const matchingFields = this.findMatchingFields(rule.target.field, dataset);
    
    // Apply rule to each matching field
    for (const field of matchingFields) {
      const fieldValue = this.getFieldValue(field, dataset);
      const validationResult = this.executeRule(rule, fieldValue, dataset);
      
      if (validationResult) {
        this.results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          field: field,
          value: fieldValue,
          severity: rule.severity || 'error',
          message: validationResult.message,
          passed: validationResult.passed
        });
      }
    }
  }

  /**
   * Find fields in dataset that match the target pattern
   * @param {String} pattern - Field pattern to match
   * @param {Object} dataset - Dataset to search
   * @returns {Array} Matching field names
   */
  findMatchingFields(pattern, dataset) {
    const fields = [];
    
    // Handle wildcard patterns
    if (pattern === '*') {
      // Match all fields
      return Object.keys(dataset);
    } else if (pattern.includes('*')) {
      // Handle field patterns with wildcards
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`, 'i');
      
      for (const field in dataset) {
        if (regex.test(field)) {
          fields.push(field);
        }
      }
    } else {
      // Exact field match
      if (dataset.hasOwnProperty(pattern)) {
        fields.push(pattern);
      }
    }
    
    return fields;
 }

  /**
   * Get the value of a field from the dataset
   * @param {String} field - Field name
   * @param {Object} dataset - Dataset to extract from
   * @returns {*} Field value
   */
  getFieldValue(field, dataset) {
    return dataset[field];
  }

  /**
   * Execute a specific validation rule
   * @param {Object} rule - Rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
 executeRule(rule, value, dataset) {
    switch (rule.ruleType) {
      case 'format':
        return this.validateFormat(rule, value);
      case 'range':
        return this.validateRange(rule, value);
      case 'completeness':
        return this.validateCompleteness(rule, value);
      case 'uniqueness':
        return this.validateUniqueness(rule, value, dataset);
      case 'crossField':
        return this.validateCrossField(rule, value, dataset);
      case 'custom':
        return this.validateCustom(rule, value, dataset);
      default:
        return {
          passed: false,
          message: `Unknown rule type: ${rule.ruleType}`
        };
    }
 }

  /**
   * Validate format rules
   * @param {Object} rule - Format rule definition
   * @param {*} value - Value to validate
   * @returns {Object} Validation result
   */
  validateFormat(rule, value) {
    if (value === undefined || value === null) {
      return { passed: true }; // Skip format validation for undefined/null values
    }
    
    const stringValue = String(value);
    
    // Check data type if specified
    if (rule.configuration.dataType) {
      const typeCheck = this.checkDataType(stringValue, rule.configuration.dataType);
      if (!typeCheck.passed) {
        return typeCheck;
      }
    }
    
    // Check pattern if specified
    if (rule.configuration.pattern) {
      const regex = new RegExp(rule.configuration.pattern);
      if (!regex.test(stringValue)) {
        return {
          passed: false,
          message: `Value '${stringValue}' does not match required format pattern`
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Check if a value matches a specific data type
   * @param {String} value - Value to check
   * @param {String} dataType - Expected data type
   * @returns {Object} Type check result
   */
  checkDataType(value, dataType) {
    switch (dataType) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return {
          passed: emailRegex.test(value),
          message: `Value '${value}' is not a valid email address`
        };
      case 'phone':
        const phoneRegex = /^\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})$/;
        return {
          passed: phoneRegex.test(value),
          message: `Value '${value}' is not a valid phone number`
        };
      case 'url':
        try {
          new URL(value);
          return { passed: true };
        } catch (e) {
          return {
            passed: false,
            message: `Value '${value}' is not a valid URL`
          };
        }
      case 'number':
        return {
          passed: !isNaN(Number(value)),
          message: `Value '${value}' is not a valid number`
        };
      case 'date':
        const date = new Date(value);
        return {
          passed: !isNaN(date.getTime()),
          message: `Value '${value}' is not a valid date`
        };
      default:
        return { passed: true }; // Pass for unknown types
    }
  }

  /**
   * Validate range rules
   * @param {Object} rule - Range rule definition
   * @param {*} value - Value to validate
   * @returns {Object} Validation result
   */
 validateRange(rule, value) {
    if (value === undefined || value === null) {
      return { passed: true }; // Skip range validation for undefined/null values
    }
    
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return {
        passed: false,
        message: `Value '${value}' is not a valid number for range validation`
      };
    }
    
    const min = rule.configuration.min;
    const max = rule.configuration.max;
    const inclusive = rule.configuration.inclusive !== false;
    
    let passed = true;
    let message = '';
    
    if (min !== undefined) {
      if (inclusive ? numValue < min : numValue <= min) {
        passed = false;
        message = `Value ${numValue} is below minimum ${inclusive ? '' : 'exclusive '}limit of ${min}`;
      }
    }
    
    if (max !== undefined && passed) {
      if (inclusive ? numValue > max : numValue >= max) {
        passed = false;
        message = `Value ${numValue} is above maximum ${inclusive ? '' : 'exclusive '}limit of ${max}`;
      }
    }
    
    return { passed, message };
 }

  /**
   * Validate completeness rules
   * @param {Object} rule - Completeness rule definition
   * @param {*} value - Value to validate
   * @returns {Object} Validation result
   */
  validateCompleteness(rule, value) {
    // Check if field is required
    if (rule.configuration.required === true) {
      if (value === undefined || value === null) {
        return {
          passed: false,
          message: 'Required field is missing'
        };
      }
    }
    
    // Check if field must not be empty
    if (rule.configuration.notEmpty === true) {
      if (value === undefined || value === null || String(value).trim() === '') {
        return {
          passed: false,
          message: 'Field must not be empty'
        };
      }
    }
    
    // Check minimum length for string fields
    if (rule.configuration.minLength !== undefined) {
      if (value === undefined || value === null) {
        // If value is undefined/null, only fail if it's also required
        if (rule.configuration.required !== true) {
          return { passed: true };
        }
      } else {
        const stringValue = String(value);
        if (stringValue.length < rule.configuration.minLength) {
          return {
            passed: false,
            message: `Field length ${stringValue.length} is below minimum required length of ${rule.configuration.minLength}`
          };
        }
      }
    }
    
    return { passed: true };
  }

  /**
   * Validate uniqueness rules
   * @param {Object} rule - Uniqueness rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateUniqueness(rule, value, dataset) {
    // For simplicity in this prototype, we'll assume uniqueness is within the current dataset
    // In a real implementation, this would check against a database or other persistence
    
    if (value === undefined || value === null) {
      return { passed: true }; // Skip uniqueness validation for undefined/null values
    }
    
    // Count occurrences of this value in the dataset
    let count = 0;
    for (const field in dataset) {
      if (dataset[field] === value) {
        count++;
      }
    }
    
    if (count > 1) {
      return {
        passed: false,
        message: `Value '${value}' is not unique within the dataset`
      };
    }
    
    return { passed: true };
  }

  /**
   * Validate cross-field rules with advanced dependencies
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateCrossField(rule, value, dataset) {
    // Check if required configuration exists
    if (!rule.configuration) {
      return { passed: true }; // Skip if no configuration
    }
    
    // Handle different types of cross-field validations
    if (rule.configuration.type === 'conditional') {
      // Conditional validation: if one field meets a condition, another field must also meet a condition
      return this.validateConditionalCrossField(rule, value, dataset);
    } else if (rule.configuration.type === 'comparison') {
      // Comparison validation: compare values between fields
      return this.validateComparisonCrossField(rule, value, dataset);
    } else if (rule.configuration.type === 'dependency') {
      // Dependency validation: one field's validity depends on another field
      return this.validateDependencyCrossField(rule, value, dataset);
    } else if (rule.configuration.type === 'businessRule') {
      // Business rule validation: complex business logic across fields
      return this.validateBusinessRuleCrossField(rule, value, dataset);
    } else {
      // Legacy support for basic condition format
      return this.validateLegacyCrossField(rule, value, dataset);
    }
  }

  /**
   * Validate legacy cross-field rule (for backward compatibility)
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
 validateLegacyCrossField(rule, value, dataset) {
    const dependentField = rule.configuration.dependentField;
    const condition = rule.configuration.condition;
    
    if (!dependentField || !condition) {
      return { passed: true }; // Skip if not properly configured
    }
    
    const dependentValue = dataset[dependentField];
    
    // Safely evaluate the condition using a custom expression evaluator
    try {
      const result = this.evaluateExpression(condition, dependentValue, dataset);
      return { passed: result };
    } catch (e) {
      return {
        passed: false,
        message: `Error evaluating cross-field condition: ${e.message}`
      };
    }
 }

  /**
   * Validate conditional cross-field rule
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateConditionalCrossField(rule, value, dataset) {
    const conditionField = rule.configuration.conditionField;
    const conditionValue = rule.configuration.conditionValue;
    const conditionOperator = rule.configuration.conditionOperator || 'equals';
    const targetField = rule.configuration.targetField;
    const targetCondition = rule.configuration.targetCondition;
    
    if (!conditionField || !targetField) {
      return { passed: true }; // Skip if not properly configured
    }
    
    const conditionFieldValue = dataset[conditionField];
    const targetFieldValue = dataset[targetField];
    
    // Check if the condition field meets the required condition
    let conditionMet = false;
    
    switch (conditionOperator) {
      case 'equals':
        conditionMet = conditionFieldValue == conditionValue;
        break;
      case 'notEquals':
        conditionMet = conditionFieldValue != conditionValue;
        break;
      case 'greaterThan':
        conditionMet = Number(conditionFieldValue) > Number(conditionValue);
        break;
      case 'lessThan':
        conditionMet = Number(conditionFieldValue) < Number(conditionValue);
        break;
      case 'greaterThanOrEqual':
        conditionMet = Number(conditionFieldValue) >= Number(conditionValue);
        break;
      case 'lessThanOrEqual':
        conditionMet = Number(conditionFieldValue) <= Number(conditionValue);
        break;
      case 'contains':
        conditionMet = String(conditionFieldValue).includes(String(conditionValue));
        break;
      case 'startsWith':
        conditionMet = String(conditionFieldValue).startsWith(String(conditionValue));
        break;
      case 'endsWith':
        conditionMet = String(conditionFieldValue).endsWith(String(conditionValue));
        break;
      default:
        conditionMet = conditionFieldValue == conditionValue;
    }
    
    // If condition is met, validate the target field
    if (conditionMet) {
      if (targetCondition) {
        // Apply the target condition to the target field value
        const targetValidation = this.evaluateTargetCondition(targetFieldValue, targetCondition);
        if (!targetValidation.passed) {
          return {
            passed: false,
            message: `Conditional validation failed: ${targetValidation.message}`
          };
        }
      }
    }
    
    return { passed: true };
  }

  /**
   * Validate comparison cross-field rule
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateComparisonCrossField(rule, value, dataset) {
    const field1 = rule.configuration.field1;
    const field2 = rule.configuration.field2;
    const comparisonOperator = rule.configuration.comparisonOperator;
    
    if (!field1 || !field2 || !comparisonOperator) {
      return { passed: true }; // Skip if not properly configured
    }
    
    let value1 = dataset[field1];
    let value2 = dataset[field2];
    
    // Convert values to appropriate types for comparison
    if (comparisonOperator === 'lessThan' || comparisonOperator === 'greaterThan' || 
        comparisonOperator === 'lessThanOrEqual' || comparisonOperator === 'greaterThanOrEqual' ||
        comparisonOperator === 'sumEquals' || comparisonOperator === 'sumLessThan' || comparisonOperator === 'sumGreaterThan') {
      // Check if these are date strings and convert them to dates for comparison
      if (this.isValidDate(value1) && this.isValidDate(value2)) {
        value1 = new Date(value1);
        value2 = new Date(value2);
      } else {
        // Convert to numbers for numeric comparison
        value1 = Number(value1);
        value2 = Number(value2);
      }
    }
    
    // Perform the comparison based on the operator
    let comparisonResult = false;
    
    switch (comparisonOperator) {
      case 'equals':
        comparisonResult = value1 == value2;
        break;
      case 'notEquals':
        comparisonResult = value1 != value2;
        break;
      case 'greaterThan':
        comparisonResult = value1 > value2;
        break;
      case 'lessThan':
        comparisonResult = value1 < value2;
        break;
      case 'greaterThanOrEqual':
        comparisonResult = value1 >= value2;
        break;
      case 'lessThanOrEqual':
        comparisonResult = value1 <= value2;
        break;
      case 'sumEquals':
        comparisonResult = (Number(value1) + Number(value2)) == Number(rule.configuration.expectedSum);
        break;
      case 'sumLessThan':
        comparisonResult = (Number(value1) + Number(value2)) < Number(rule.configuration.expectedSum);
        break;
      case 'sumGreaterThan':
        comparisonResult = (Number(value1) + Number(value2)) > Number(rule.configuration.expectedSum);
        break;
      default:
        comparisonResult = value1 == value2;
    }
    
    if (!comparisonResult) {
      return {
        passed: false,
        message: `Comparison validation failed: ${field1} ${comparisonOperator} ${field2} condition not met`
      };
    }
    
    return { passed: true };
  }

  /**
   * Check if a value is a valid date string
   * @param {*} value - Value to check
   * @returns {Boolean} Whether the value is a valid date
   */
  isValidDate(value) {
    if (typeof value !== 'string') {
      return false;
    }
    
    const date = new Date(value);
    return date instanceof Date && !isNaN(date) && !isNaN(date.getTime());
  }

  /**
   * Validate dependency cross-field rule
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateDependencyCrossField(rule, value, dataset) {
    const dependentField = rule.configuration.dependentField;
    const requiredValue = rule.configuration.requiredValue;
    const targetField = rule.configuration.targetField;
    
    if (!dependentField || !targetField) {
      return { passed: true }; // Skip if not properly configured
    }
    
    const dependentValue = dataset[dependentField];
    const targetValue = dataset[targetField];
    
    // If the dependent field has the required value, then the target field must be present and valid
    if (dependentValue == requiredValue) {
      if (targetValue === undefined || targetValue === null || targetValue === '') {
        return {
          passed: false,
          message: `When ${dependentField} is ${requiredValue}, ${targetField} is required`
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Validate business rule cross-field rule
   * @param {Object} rule - Cross-field rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateBusinessRuleCrossField(rule, value, dataset) {
    const businessRule = rule.configuration.businessRule;
    
    if (!businessRule) {
      return { passed: true }; // Skip if no business rule defined
    }
    
    // Apply different types of business rules
    switch (businessRule) {
      case 'age-verification':
        return this.validateAgeVerificationRule(dataset);
      case 'email-phone-required':
        return this.validateEmailOrPhoneRequiredRule(dataset);
      case 'minors-consent':
        return this.validateMinorsConsentRule(dataset);
      case 'salary-verification':
        return this.validateSalaryVerificationRule(dataset);
      default:
        return { passed: true }; // Skip unknown business rules
    }
  }

  /**
   * Validate age verification business rule
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateAgeVerificationRule(dataset) {
    const age = dataset.age;
    const idType = dataset.idType;
    const verificationDocument = dataset.verificationDocument;
    
    // If age is 18 or above, ID verification is required
    if (age >= 18) {
      if (!idType || !verificationDocument) {
        return {
          passed: false,
          message: 'For users 18 or older, ID type and verification document are required'
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Validate email or phone required business rule
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
 validateEmailOrPhoneRequiredRule(dataset) {
    const email = dataset.email;
    const phone = dataset.phone;
    
    // At least one of email or phone must be provided
    if ((!email || email === '') && (!phone || phone === '')) {
      return {
        passed: false,
        message: 'Either email or phone must be provided'
      };
    }
    
    return { passed: true };
  }

  /**
   * Validate minors consent business rule
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateMinorsConsentRule(dataset) {
    const age = dataset.age;
    const guardianConsent = dataset.guardianConsent;
    const guardianEmail = dataset.guardianEmail;
    
    // If age is below 18, guardian consent is required
    if (age < 18) {
      if (!guardianConsent) {
        return {
          passed: false,
          message: 'Guardian consent is required for users under 18'
        };
      }
      
      if (!guardianEmail) {
        return {
          passed: false,
          message: 'Guardian email is required for users under 18'
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Validate salary verification business rule
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateSalaryVerificationRule(dataset) {
    const salary = dataset.salary;
    const salaryVerification = dataset.salaryVerification;
    const employmentStatus = dataset.employmentStatus;
    
    // If salary is above 10,000, verification is required
    if (salary > 100000) {
      if (!salaryVerification) {
        return {
          passed: false,
          message: 'Salary verification is required for salaries above 100,000'
        };
      }
    }
    
    // If salary is provided and above 0, employment status should be verified
    if (salary > 0 && employmentStatus !== 'employed' && employmentStatus !== 'self-employed' && employmentStatus !== 'retired' && employmentStatus !== 'unemployed' && employmentStatus !== 'student') {
      return {
        passed: false,
        message: 'Valid employment status must be provided when salary is specified'
      };
    }
    
    return { passed: true };
  }

  /**
   * Evaluate a target condition for conditional validation
   * @param {*} value - Value to check
   * @param {Object} condition - Condition to evaluate
   * @returns {Object} Validation result
   */
  evaluateTargetCondition(value, condition) {
    if (condition.type === 'required') {
      if (value === undefined || value === null || value === '') {
        return {
          passed: false,
          message: condition.message || 'Field is required based on conditional rule'
        };
      }
    } else if (condition.type === 'format') {
      if (condition.pattern) {
        const regex = new RegExp(condition.pattern);
        if (!regex.test(String(value))) {
          return {
            passed: false,
            message: condition.message || `Value does not match required format: ${condition.pattern}`
          };
        }
      }
    } else if (condition.type === 'range') {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return {
          passed: false,
          message: condition.message || 'Value must be a number'
        };
      }
      
      if (condition.min !== undefined && numValue < condition.min) {
        return {
          passed: false,
          message: condition.message || `Value ${numValue} is below minimum ${condition.min}`
        };
      }
      
      if (condition.max !== undefined && numValue > condition.max) {
        return {
          passed: false,
          message: condition.message || `Value ${numValue} is above maximum ${condition.max}`
        };
      }
    }
    
    return { passed: true };
  }

  /**
   * Safely evaluate an expression
   * @param {String} expression - Expression to evaluate
   * @param {*} dependentValue - Value of the dependent field
   * @param {Object} dataset - Full dataset for context
   * @returns {Boolean} Result of the evaluation
   */
  evaluateExpression(expression, dependentValue, dataset) {
    // This is a safer alternative to eval() for simple expressions
    // In a production environment, consider using a proper expression parser library
    
    // For now, support simple comparison expressions
    if (typeof expression === 'string') {
      // Handle common comparison patterns
      if (expression.includes('==')) {
        const [left, right] = expression.split('==').map(s => s.trim());
        return dependentValue == this.resolveValue(right, dataset);
      } else if (expression.includes('!=')) {
        const [left, right] = expression.split('!=').map(s => s.trim());
        return dependentValue != this.resolveValue(right, dataset);
      } else if (expression.includes('>=')) {
        const [left, right] = expression.split('>=').map(s => s.trim());
        return Number(dependentValue) >= Number(this.resolveValue(right, dataset));
      } else if (expression.includes('<=')) {
        const [left, right] = expression.split('<=').map(s => s.trim());
        return Number(dependentValue) <= Number(this.resolveValue(right, dataset));
      } else if (expression.includes('>')) {
        const [left, right] = expression.split('>').map(s => s.trim());
        return Number(dependentValue) > Number(this.resolveValue(right, dataset));
      } else if (expression.includes('<')) {
        const [left, right] = expression.split('<').map(s => s.trim());
        return Number(dependentValue) < Number(this.resolveValue(right, dataset));
      } else if (expression.includes('includes')) {
        const [left, right] = expression.split('includes').map(s => s.trim());
        return String(dependentValue).includes(String(this.resolveValue(right, dataset)));
      }
    }
    
    // If expression is a boolean, return it directly
    if (typeof expression === 'boolean') {
      return expression;
    }
    
    // Default: return true if expression is truthy
    return Boolean(expression);
  }

  /**
   * Resolve a value that might be a field reference
   * @param {String} value - Value to resolve
   * @param {Object} dataset - Full dataset for context
   * @returns {*} Resolved value
   */
  resolveValue(value, dataset) {
    // If the value is enclosed in brackets, treat it as a field reference
    if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
      const fieldName = value.substring(1, value.length - 1);
      return dataset[fieldName];
    }
    return value;
  }

  /**
   * Validate custom rules
   * @param {Object} rule - Custom rule definition
   * @param {*} value - Value to validate
   * @param {Object} dataset - Full dataset for context
   * @returns {Object} Validation result
   */
  validateCustom(rule, value, dataset) {
    // Custom validation would typically involve executing a user-defined function
    // For this prototype, we'll just return passed
    
    // In a real implementation, this might look like:
    // const customFunction = getCustomFunction(rule.configuration.functionName);
    // return customFunction(value, dataset, rule.configuration.parameters);
    
    return { passed: true };
  }
}

module.exports = ValidationEngine;