// Validation Rule Management UI
class ValidationRuleManager {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3005'; // UI server that proxies to rule management API
        this.currentRule = null;
        this.init();
    }

    init() {
        // Bind event listeners
        document.getElementById('loadRulesBtn').addEventListener('click', () => this.loadRules());
        document.getElementById('addRuleBtn').addEventListener('click', () => this.showAddForm());
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideForm());
        document.getElementById('validationRuleForm').addEventListener('submit', (e) => this.saveRule(e));
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterRules(e.target.value));
        
        // Load rules on initialization
        this.loadRules();
    }

    async loadRules() {
        try {
            this.showMessage('Loading rules...', 'info');
            const response = await fetch(`${this.apiBaseUrl}/api/rules`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayRules(data.rules);
            this.hideMessage();
        } catch (error) {
            console.error('Error loading rules:', error);
            this.showMessage(`Error loading rules: ${error.message}`, 'error');
        }
    }

    displayRules(rules) {
        const rulesList = document.getElementById('rulesList');
        
        if (rules.length === 0) {
            rulesList.innerHTML = '<div class="no-rules">No validation rules found. Add a new rule to get started.</div>';
            return;
        }

        rulesList.innerHTML = rules.map(rule => `
            <div class="rule-card" data-rule-id="${rule.id}">
                <h3>
                    ${rule.name}
                    <span class="rule-type">${rule.ruleType}</span>
                </h3>
                <p>${rule.description || 'No description provided'}</p>
                <div class="rule-target">Target: ${rule.target?.field || 'N/A'}</div>
                <div class="rule-actions">
                    <button class="btn btn-primary" onclick="ruleManager.editRule('${rule.id}')">Edit</button>
                    <button class="btn btn-danger" onclick="ruleManager.deleteRule('${rule.id}')">Delete</button>
                    <button class="btn btn-success" onclick="ruleManager.testRule('${rule.id}')">Test</button>
                </div>
                ${this.formatRuleDetails(rule)}
            </div>
        `).join('');
    }

    formatRuleDetails(rule) {
        let details = '<div class="rule-details">';
        
        if (rule.configuration) {
            details += '<strong>Configuration:</strong><br>';
            details += this.formatConfiguration(rule.configuration, 0);
        }
        
        details += '</div>';
        return details;
    }

    formatConfiguration(config, depth) {
        let html = '';
        const indent = '&nbsp;'.repeat(depth * 4);
        
        for (const [key, value] of Object.entries(config)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                html += `${indent}${key}:<br>`;
                html += this.formatConfiguration(value, depth + 1);
            } else {
                html += `${indent}${key}: ${value}<br>`;
            }
        }
        
        return html;
    }

    showAddForm() {
        this.currentRule = null;
        document.getElementById('formTitle').textContent = 'Add New Rule';
        document.getElementById('validationRuleForm').reset();
        document.getElementById('ruleId').value = '';
        
        // Reset configuration fields
        document.getElementById('configFields').innerHTML = '';
        
        document.getElementById('ruleForm').style.display = 'block';
        this.updateConfigFields();
    }

    editRule(ruleId) {
        // Find the rule in the currently displayed list
        fetch(`${this.apiBaseUrl}/api/rules/${ruleId}`)
            .then(response => response.json())
            .then(data => {
                if (data.rule) {
                    this.currentRule = data.rule;
                    this.populateForm(data.rule);
                    document.getElementById('formTitle').textContent = 'Edit Rule';
                    document.getElementById('ruleForm').style.display = 'block';
                    this.updateConfigFields();
                } else {
                    this.showMessage('Rule not found', 'error');
                }
            })
            .catch(error => {
                console.error('Error fetching rule:', error);
                this.showMessage(`Error fetching rule: ${error.message}`, 'error');
            });
    }

    populateForm(rule) {
        document.getElementById('ruleId').value = rule.id;
        document.getElementById('ruleName').value = rule.name;
        document.getElementById('ruleDescription').value = rule.description || '';
        document.getElementById('ruleType').value = rule.ruleType;
        document.getElementById('targetField').value = rule.target?.field || '';
        document.getElementById('severity').value = rule.severity || 'error';
    }

    hideForm() {
        document.getElementById('ruleForm').style.display = 'none';
    }

    updateConfigFields() {
        const ruleType = document.getElementById('ruleType').value;
        const configFields = document.getElementById('configFields');
        
        // Clear existing configuration fields
        configFields.innerHTML = '';
        
        if (!ruleType) return;
        
        // Create configuration fields based on rule type
        switch (ruleType) {
            case 'format':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="formatPattern">Pattern</label>
                            <input type="text" id="formatPattern" placeholder="Regular expression pattern">
                        </div>
                        <div class="config-field">
                            <label for="formatDataType">Data Type</label>
                            <select id="formatDataType">
                                <option value="">Generic</option>
                                <option value="email">Email</option>
                                <option value="phone">Phone</option>
                                <option value="url">URL</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
                
            case 'range':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="rangeMin">Minimum Value</label>
                            <input type="number" id="rangeMin">
                        </div>
                        <div class="config-field">
                            <label for="rangeMax">Maximum Value</label>
                            <input type="number" id="rangeMax">
                        </div>
                        <div class="config-field">
                            <label for="rangeInclusive">
                                <input type="checkbox" id="rangeInclusive" checked> Inclusive Range
                            </label>
                        </div>
                    </div>
                `;
                break;
                
            case 'completeness':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="compRequired">
                                <input type="checkbox" id="compRequired"> Required Field
                            </label>
                        </div>
                        <div class="config-field">
                            <label for="compNotEmpty">
                                <input type="checkbox" id="compNotEmpty"> Not Empty
                            </label>
                        </div>
                        <div class="config-field">
                            <label for="compMinLength">Minimum Length</label>
                            <input type="number" id="compMinLength" min="0">
                        </div>
                    </div>
                `;
                break;
                
            case 'crossField':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="crossFieldType">Cross-Field Type</label>
                            <select id="crossFieldType">
                                <option value="conditional">Conditional</option>
                                <option value="comparison">Comparison</option>
                                <option value="dependency">Dependency</option>
                                <option value="businessRule">Business Rule</option>
                            </select>
                        </div>
                        <div id="crossFieldSpecificConfig"></div>
                    </div>
                `;
                
                // Add event listener for cross-field type change
                document.getElementById('crossFieldType').addEventListener('change', (e) => {
                    this.updateCrossFieldConfig(e.target.value);
                });
                break;
                
            case 'uniqueness':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="uniquenessScope">Scope</label>
                            <select id="uniquenessScope">
                                <option value="collection">Collection</option>
                                <option value="dataset">Dataset</option>
                            </select>
                        </div>
                    </div>
                `;
                break;
                
            case 'custom':
                configFields.innerHTML = `
                    <div class="config-section">
                        <div class="config-field">
                            <label for="customFunction">Function Name</label>
                            <input type="text" id="customFunction" placeholder="Name of custom validation function">
                        </div>
                        <div class="config-field">
                            <label for="customParameters">Parameters (JSON)</label>
                            <textarea id="customParameters" rows="3" placeholder='{"param1": "value1", "param2": "value2"}'></textarea>
                        </div>
                    </div>
                `;
                break;
                
            default:
                configFields.innerHTML = '<p>No specific configuration needed for this rule type.</p>';
        }
        
        // If editing an existing rule, populate the configuration fields
        if (this.currentRule && this.currentRule.configuration) {
            this.populateConfigFields(this.currentRule.configuration);
        }
    }

    updateCrossFieldConfig(type) {
        const specificConfigDiv = document.getElementById('crossFieldSpecificConfig');
        
        switch (type) {
            case 'conditional':
                specificConfigDiv.innerHTML = `
                    <div class="config-field">
                        <label for="conditionField">Condition Field</label>
                        <input type="text" id="conditionField" placeholder="Field to check condition on">
                    </div>
                    <div class="config-field">
                        <label for="conditionValue">Condition Value</label>
                        <input type="text" id="conditionValue" placeholder="Value to compare against">
                    </div>
                    <div class="config-field">
                        <label for="conditionOperator">Condition Operator</label>
                        <select id="conditionOperator">
                            <option value="equals">Equals</option>
                            <option value="notEquals">Not Equals</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="greaterThanOrEqual">Greater Than or Equal</option>
                            <option value="lessThanOrEqual">Less Than or Equal</option>
                            <option value="contains">Contains</option>
                            <option value="startsWith">Starts With</option>
                            <option value="endsWith">Ends With</option>
                        </select>
                    </div>
                    <div class="config-field">
                        <label for="targetFieldConditional">Target Field</label>
                        <input type="text" id="targetFieldConditional" placeholder="Field to validate if condition is met">
                    </div>
                `;
                break;
                
            case 'comparison':
                specificConfigDiv.innerHTML = `
                    <div class="config-field">
                        <label for="field1">First Field</label>
                        <input type="text" id="field1" placeholder="First field to compare">
                    </div>
                    <div class="config-field">
                        <label for="field2">Second Field</label>
                        <input type="text" id="field2" placeholder="Second field to compare">
                    </div>
                    <div class="config-field">
                        <label for="comparisonOperator">Comparison Operator</label>
                        <select id="comparisonOperator">
                            <option value="equals">Equals</option>
                            <option value="notEquals">Not Equals</option>
                            <option value="greaterThan">Greater Than</option>
                            <option value="lessThan">Less Than</option>
                            <option value="greaterThanOrEqual">Greater Than or Equal</option>
                            <option value="lessThanOrEqual">Less Than or Equal</option>
                            <option value="sumEquals">Sum Equals</option>
                            <option value="sumLessThan">Sum Less Than</option>
                            <option value="sumGreaterThan">Sum Greater Than</option>
                        </select>
                    </div>
                `;
                break;
                
            case 'dependency':
                specificConfigDiv.innerHTML = `
                    <div class="config-field">
                        <label for="dependentField">Dependent Field</label>
                        <input type="text" id="dependentField" placeholder="Field that determines dependency">
                    </div>
                    <div class="config-field">
                        <label for="requiredValue">Required Value</label>
                        <input type="text" id="requiredValue" placeholder="Value that triggers dependency">
                    </div>
                    <div class="config-field">
                        <label for="dependencyTargetField">Target Field</label>
                        <input type="text" id="dependencyTargetField" placeholder="Field required when dependency is met">
                    </div>
                `;
                break;
                
            case 'businessRule':
                specificConfigDiv.innerHTML = `
                    <div class="config-field">
                        <label for="businessRuleType">Business Rule Type</label>
                        <select id="businessRuleType">
                            <option value="email-phone-required">Email or Phone Required</option>
                            <option value="minors-consent">Minors Consent</option>
                            <option value="salary-verification">Salary Verification</option>
                            <option value="age-verification">Age Verification</option>
                        </select>
                    </div>
                `;
                break;
                
            default:
                specificConfigDiv.innerHTML = '';
        }
        
        // If editing an existing rule, populate the specific config fields
        if (this.currentRule && this.currentRule.configuration) {
            this.populateCrossFieldConfig(this.currentRule.configuration);
        }
    }

    populateConfigFields(config) {
        // Populate common config fields based on rule type
        const ruleType = document.getElementById('ruleType').value;
        
        switch (ruleType) {
            case 'format':
                if (config.pattern) document.getElementById('formatPattern').value = config.pattern;
                if (config.dataType) document.getElementById('formatDataType').value = config.dataType;
                break;
                
            case 'range':
                if (config.min !== undefined) document.getElementById('rangeMin').value = config.min;
                if (config.max !== undefined) document.getElementById('rangeMax').value = config.max;
                if (config.inclusive !== undefined) document.getElementById('rangeInclusive').checked = config.inclusive;
                break;
                
            case 'completeness':
                if (config.required !== undefined) document.getElementById('compRequired').checked = config.required;
                if (config.notEmpty !== undefined) document.getElementById('compNotEmpty').checked = config.notEmpty;
                if (config.minLength !== undefined) document.getElementById('compMinLength').value = config.minLength;
                break;
                
            case 'uniqueness':
                if (config.scope) document.getElementById('uniquenessScope').value = config.scope;
                break;
                
            case 'custom':
                if (config.functionName) document.getElementById('customFunction').value = config.functionName;
                if (config.parameters) document.getElementById('customParameters').value = JSON.stringify(config.parameters, null, 2);
                break;
                
            case 'crossField':
                if (config.type) {
                    document.getElementById('crossFieldType').value = config.type;
                    // Trigger update for specific config
                    this.updateCrossFieldConfig(config.type);
                    // Populate the specific config fields
                    this.populateCrossFieldConfig(config);
                }
                break;
        }
    }

    populateCrossFieldConfig(config) {
        const type = document.getElementById('crossFieldType').value;
        
        switch (type) {
            case 'conditional':
                if (config.conditionField) document.getElementById('conditionField').value = config.conditionField;
                if (config.conditionValue) document.getElementById('conditionValue').value = config.conditionValue;
                if (config.conditionOperator) document.getElementById('conditionOperator').value = config.conditionOperator;
                if (config.targetField) document.getElementById('targetFieldConditional').value = config.targetField;
                break;
                
            case 'comparison':
                if (config.field1) document.getElementById('field1').value = config.field1;
                if (config.field2) document.getElementById('field2').value = config.field2;
                if (config.comparisonOperator) document.getElementById('comparisonOperator').value = config.comparisonOperator;
                if (config.expectedSum) document.getElementById('expectedSum').value = config.expectedSum;
                break;
                
            case 'dependency':
                if (config.dependentField) document.getElementById('dependentField').value = config.dependentField;
                if (config.requiredValue) document.getElementById('requiredValue').value = config.requiredValue;
                if (config.targetField) document.getElementById('dependencyTargetField').value = config.targetField;
                break;
                
            case 'businessRule':
                if (config.businessRule) document.getElementById('businessRuleType').value = config.businessRule;
                break;
        }
    }

    async saveRule(e) {
        e.preventDefault();
        
        try {
            const ruleData = this.getRuleDataFromForm();
            
            // Validate required fields
            if (!ruleData.id || !ruleData.name || !ruleData.ruleType || !ruleData.target.field) {
                throw new Error('Please fill in all required fields: ID, Name, Rule Type, and Target Field');
            }
            
            let response;
            if (this.currentRule) {
                // Update existing rule
                response = await fetch(`${this.apiBaseUrl}/api/rules/${ruleData.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ruleData)
                });
            } else {
                // Create new rule
                response = await fetch(`${this.apiBaseUrl}/api/rules`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(ruleData)
                });
            }
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            this.showMessage(`Rule ${this.currentRule ? 'updated' : 'created'} successfully!`, 'success');
            
            // Reload rules and hide form
            setTimeout(() => {
                this.loadRules();
                this.hideForm();
            }, 1500);
        } catch (error) {
            console.error('Error saving rule:', error);
            this.showMessage(`Error saving rule: ${error.message}`, 'error');
        }
    }

    getRuleDataFromForm() {
        const id = document.getElementById('ruleId').value || this.generateId();
        const name = document.getElementById('ruleName').value;
        const description = document.getElementById('ruleDescription').value;
        const ruleType = document.getElementById('ruleType').value;
        const targetField = document.getElementById('targetField').value;
        const severity = document.getElementById('severity').value;
        
        // Build configuration object based on rule type
        const configuration = this.getConfigurationFromForm(ruleType);
        
        return {
            id,
            name,
            description,
            ruleType,
            target: { field: targetField },
            configuration,
            severity
        };
    }

    getConfigurationFromForm(ruleType) {
        const config = {};
        
        switch (ruleType) {
            case 'format':
                const pattern = document.getElementById('formatPattern')?.value;
                const dataType = document.getElementById('formatDataType')?.value;
                
                if (pattern) config.pattern = pattern;
                if (dataType) config.dataType = dataType;
                break;
                
            case 'range':
                const min = document.getElementById('rangeMin')?.value;
                const max = document.getElementById('rangeMax')?.value;
                const inclusive = document.getElementById('rangeInclusive')?.checked;
                
                if (min !== '') config.min = parseFloat(min);
                if (max !== '') config.max = parseFloat(max);
                config.inclusive = inclusive;
                break;
                
            case 'completeness':
                const required = document.getElementById('compRequired')?.checked;
                const notEmpty = document.getElementById('compNotEmpty')?.checked;
                const minLength = document.getElementById('compMinLength')?.value;
                
                if (required !== undefined) config.required = required;
                if (notEmpty !== undefined) config.notEmpty = notEmpty;
                if (minLength !== '') config.minLength = parseInt(minLength);
                break;
                
            case 'uniqueness':
                const scope = document.getElementById('uniquenessScope')?.value;
                if (scope) config.scope = scope;
                break;
                
            case 'custom':
                const functionName = document.getElementById('customFunction')?.value;
                const parametersStr = document.getElementById('customParameters')?.value;
                
                if (functionName) config.functionName = functionName;
                if (parametersStr) {
                    try {
                        config.parameters = JSON.parse(parametersStr);
                    } catch (e) {
                        console.warn('Invalid JSON in custom parameters:', e);
                        config.parameters = {};
                    }
                }
                break;
                
            case 'crossField':
                const crossFieldType = document.getElementById('crossFieldType')?.value;
                if (crossFieldType) {
                    config.type = crossFieldType;
                    
                    switch (crossFieldType) {
                        case 'conditional':
                            const conditionField = document.getElementById('conditionField')?.value;
                            const conditionValue = document.getElementById('conditionValue')?.value;
                            const conditionOperator = document.getElementById('conditionOperator')?.value;
                            const targetFieldConditional = document.getElementById('targetFieldConditional')?.value;
                            
                            if (conditionField) config.conditionField = conditionField;
                            if (conditionValue) config.conditionValue = conditionValue;
                            if (conditionOperator) config.conditionOperator = conditionOperator;
                            if (targetFieldConditional) config.targetField = targetFieldConditional;
                            break;
                            
                        case 'comparison':
                            const field1 = document.getElementById('field1')?.value;
                            const field2 = document.getElementById('field2')?.value;
                            const comparisonOperator = document.getElementById('comparisonOperator')?.value;
                            
                            if (field1) config.field1 = field1;
                            if (field2) config.field2 = field2;
                            if (comparisonOperator) config.comparisonOperator = comparisonOperator;
                            break;
                            
                        case 'dependency':
                            const dependentField = document.getElementById('dependentField')?.value;
                            const requiredValue = document.getElementById('requiredValue')?.value;
                            const dependencyTargetField = document.getElementById('dependencyTargetField')?.value;
                            
                            if (dependentField) config.dependentField = dependentField;
                            if (requiredValue) config.requiredValue = requiredValue;
                            if (dependencyTargetField) config.targetField = dependencyTargetField;
                            break;
                            
                        case 'businessRule':
                            const businessRuleType = document.getElementById('businessRuleType')?.value;
                            if (businessRuleType) config.businessRule = businessRuleType;
                            break;
                    }
                }
                break;
        }
        
        return config;
    }

    generateId() {
        return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async deleteRule(ruleId) {
        if (!confirm(`Are you sure you want to delete the rule "${ruleId}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/api/rules/${ruleId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.showMessage('Rule deleted successfully!', 'success');
            
            // Reload rules after a short delay
            setTimeout(() => {
                this.loadRules();
            }, 1000);
        } catch (error) {
            console.error('Error deleting rule:', error);
            this.showMessage(`Error deleting rule: ${error.message}`, 'error');
        }
    }

    async testRule(ruleId) {
        // Create a modal or prompt for user to enter test data
        const testDataStr = prompt(
            `Enter test data for rule "${ruleId}" as JSON:\n\nExample: {"name": "Test User", "email": "test@example.com", "age": 25}`,
            `{"testField": "testValue"}`
        );
        
        if (!testDataStr) {
            return; // User cancelled
        }
        
        try {
            // Parse the test data from user input
            const testData = JSON.parse(testDataStr);
            
            const response = await fetch(`${this.apiBaseUrl}/api/rules/${ruleId}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ testData })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Show detailed results
            let message = `Rule test completed successfully!\n\n`;
            message += `Total validations: ${result.results.length}\n`;
            message += `Passed: ${result.results.filter(r => r.passed).length}\n`;
            message += `Failed: ${result.results.filter(r => !r.passed).length}\n\n`;
            
            if (result.results.length > 0) {
                message += 'Validation Results:\n';
                result.results.forEach((validation, index) => {
                    message += `${index + 1}. Field: ${validation.field}, Value: ${validation.value}, Passed: ${validation.passed}`;
                    if (!validation.passed) {
                        message += `, Message: ${validation.message || 'No error message'}`;
                    }
                    message += '\n';
                });
            }
            
            alert(message);
            console.log('Test results:', result);
        } catch (error) {
            console.error('Error testing rule:', error);
            this.showMessage(`Error testing rule: ${error.message}`, 'error');
        }
    }

    filterRules(searchTerm) {
        const ruleCards = document.querySelectorAll('.rule-card');
        const term = searchTerm.toLowerCase();
        
        ruleCards.forEach(card => {
            const ruleName = card.querySelector('h3').textContent.toLowerCase();
            const ruleDesc = card.querySelector('p').textContent.toLowerCase();
            const ruleTarget = card.querySelector('.rule-target').textContent.toLowerCase();
            
            if (ruleName.includes(term) || ruleDesc.includes(term) || ruleTarget.includes(term)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    showMessage(message, type) {
        const messageArea = document.getElementById('messageArea');
        messageArea.textContent = message;
        messageArea.className = `message-area ${type}`;
        messageArea.style.display = 'block';
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageArea.style.display = 'none';
            }, 5000);
        }
    }

    hideMessage() {
        document.getElementById('messageArea').style.display = 'none';
    }
}

// Initialize the rule manager when the page loads
let ruleManager;
document.addEventListener('DOMContentLoaded', () => {
    ruleManager = new ValidationRuleManager();
});