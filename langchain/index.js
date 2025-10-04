const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');
const FormData = require('form-data');
const { QdrantClient } = require('@qdrant/js-client-rest');
const mammoth = require('mammoth'); // For Word documents
const XLSX = require('xlsx'); // For Excel files
const csv = require('csv-parser'); // For CSV files

global.Headers = Headers;
global.fetch = fetch;
global.FormData = FormData;

async function main() {
    // Wait for Qdrant to be ready
    const client = new QdrantClient({ 
        url: 'http://qdrant:6333',
        fetch: fetch
    });
    
    // Add retry logic for initial connection
    let retries = 10;
    while (retries > 0) {
        try {
            console.log('Attempting to connect to Qdrant...');
            await client.getCollections();
            console.log('Successfully connected to Qdrant');
            break;
        } catch (error) {
            console.log(`Waiting for Qdrant to be ready... (${retries} attempts left)`);
            console.log('Connection error:', error.message);
            await new Promise(resolve => setTimeout(resolve, 5000));
            retries--;
            if (retries === 0) {
                throw new Error('Failed to connect to Qdrant after multiple attempts');
            }
        }
    }

    try {
        // Create collection with proper configuration
        const createCollectionResponse = await client.createCollection('documents', {
            vectors: {
                size: 1024,
                distance: 'Cosine'
            }
        });
        console.log('Collection created successfully:', createCollectionResponse);
    } catch (error) {
        if (error.status === 409 || (error.data && error.data.status && error.data.status.error.includes('already exists'))) {
            console.log('Collection "documents" already exists, continuing...');
        } else {
            console.error('Error creating collection:', error);
            throw error;
        }
    }

    // Index documents
    const directoryPath = path.join(__dirname, 'documentation');
    
    // Check if documentation directory exists
    try {
        const stats = await fs.promises.stat(directoryPath);
        if (!stats.isDirectory()) {
            console.error('\x1b[31mError: /app/documentation exists but is not a directory\x1b[0m');
            console.log('\x1b[33mPlease create a directory named "documentation" in your project root and add documents to it.\x1b[0m');
            return;
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error('\x1b[31mError: Documentation directory not found!\x1b[0m');
            console.log('\x1b[33mPlease create a directory named "documentation" in your project root:\x1b[0m');
            console.log('\x1b[36mmkdir documentation\x1b[0m');
            console.log('\x1b[33mThen add your documents to it.\x1b[0m');
            return;
        }
        throw error;
    }

    // Read directory contents
    try {
        const files = await fs.promises.readdir(directoryPath);
        
        if (files.length === 0) {
            console.log('\x1b[33mWarning: Documentation directory is empty!\x1b[0m');
            console.log('\x1b[33mPlease add some documents to the documentation directory.\x1b[0m');
            console.log('\x1b[33mFor example:\x1b[0m');
            console.log('\x1b[36mecho "This is a test document" > documentation/test.txt\x1b[0m');
            return;
        }

        console.log(`Found ${files.length} files to process`);
        
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            try {
                const stats = await fs.promises.stat(filePath);
                if (!stats.isFile()) {
                    console.log(`Skipping ${file} as it's not a file`);
                    continue;
                }

                console.log(`Processing ${file}...`);
                const data = await fs.promises.readFile(filePath, 'utf8');
                const vector = await getVector(data);
                
                // Generate a numeric ID from the filename
                const id = Date.now() + Math.floor(Math.random() * 1000);
                
                const response = await client.upsert('documents', {
                    wait: true,
                    points: [
                        {
                            id: id,
                            vector: vector,
                            payload: { 
                                text: data,
                                filename: file
                            }
                        }
                    ]
                });
                console.log(`✓ Successfully indexed ${file}`);
            } catch (error) {
                console.error(`✗ Error processing ${file}:`, error.message);
                if (error.data) {
                    console.error('Error details:', JSON.stringify(error.data, null, 2));
                }
                if (error.status) {
                    console.error('HTTP Status:', error.status);
                }
            }
        }
        console.log('Indexing complete!');
    } catch (error) {
        console.error('Error reading documentation directory:', error.message);
    }
}

async function getVector(text) {
    try {
        // Wait for orchestrator to be ready with exponential backoff
        let retries = 30;
        let delay = 2000;
        
        while (retries > 0) {
            try {
                const healthResponse = await fetch('http://orchestrator:3000/health', { 
                    timeout: 2000 
                });
                
                if (healthResponse.ok) {
                    console.log('Orchestrator is ready!');
                    break;
                }
            } catch (healthError) {
                console.log(`Waiting for orchestrator... (${retries} attempts left)`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delay));
            retries--;
            delay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10 seconds
        }
        
        if (retries === 0) {
            console.log('Warning: Orchestrator not responding, will try to process anyway');
        }
        
        const response = await fetch('http://orchestrator:3000/vector', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.vector;
    } catch (error) {
        console.error('Error getting vector:', error);
        throw error;
    }
}

// Function to detect file type and extract text
async function extractTextFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
        if (ext === '.txt') {
            return await fs.promises.readFile(filePath, 'utf8');
        } else if (ext === '.docx') {
            const result = await mammoth.extractRawText({path: filePath});
            return result.value;
        } else if (ext === '.xlsx' || ext === '.xls') {
            const workbook = XLSX.readFile(filePath);
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            
            // Convert to text format
            return jsonData.map(row => row.join('\t')).join('\n');
        } else if (ext === '.csv') {
            let text = '';
            return new Promise((resolve, reject) => {
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => {
                        text += Object.values(data).join('\t') + '\n';
                    })
                    .on('end', () => {
                        resolve(text);
                    })
                    .on('error', reject);
            });
        } else if (ext === '.js' || ext === '.json' || ext === '.xml' || ext === '.html') {
            // For code/text formats, read as text
            return await fs.promises.readFile(filePath, 'utf8');
        } else {
            // For unknown formats, try to read as text
            try {
                return await fs.promises.readFile(filePath, 'utf8');
            } catch {
                // If it's a binary file, skip it
                console.log(`Skipping binary file: ${filePath}`);
                return null;
            }
        }
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error.message);
        return null;
    }
}

// Enhanced document processing with entity extraction
async function processDocument(filePath, fileName) {
    const text = await extractTextFromFile(filePath);
    if (!text) return null;
    
    // Extract entities using simple pattern matching (can be enhanced with NLP)
    const entities = extractEntities(text);
    
    // Create multiple entries for better searchability
    const entries = [];
    
    // Main document entry
    entries.push({
        text: text,
        fileName: fileName,
        type: 'full_text'
    });
    
    // Entity-specific entries for better correlation
    entities.forEach(entity => {
        entries.push({
            text: entity.text,
            fileName: fileName,
            type: 'entity',
            entityType: entity.type,
            entityName: entity.name
        });
    });
    
    return entries;
}

// Simple entity extraction (can be enhanced with proper NLP)
function extractEntities(text) {
    const entities = [];
    
    // Extract potential person names (simple pattern)
    const namePattern = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    let match;
    while ((match = namePattern.exec(text)) !== null) {
        entities.push({
            name: match[1],
            text: match[0],
            type: 'person'
        });
    }
    
    // Extract potential phone numbers
    const phonePattern = /(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/g;
    while ((match = phonePattern.exec(text)) !== null) {
        entities.push({
            name: match[1],
            text: match[0],
            type: 'phone'
        });
    }
    
    // Extract potential addresses (simple pattern)
    const addressPattern = /(\d+\s+\w+(?:\s+\w+)*,\s*\w+(?:\s+\w+)*,\s*\w{2}\s*\d{5})/g;
    while ((match = addressPattern.exec(text)) !== null) {
        entities.push({
            name: match[1],
            text: match[0],
            type: 'address'
        });
    }
    
    // Extract potential ages
    const agePattern = /\b(\d{1,3})\b\s*(?:years?\s+old|y\.?o\.?|yo|age)/gi;
    while ((match = agePattern.exec(text)) !== null) {
        entities.push({
            name: match[1],
            text: match[0],
            type: 'age'
        });
    }
    
    return entities;
}

async function runService() {
    // Wait for orchestrator to be ready with exponential backoff
    let retries = 30;
    let delay = 2000;
    
    while (retries > 0) {
        try {
            const healthResponse = await fetch('http://orchestrator:3000/health', { 
                timeout: 2000 
            });
            
            if (healthResponse.ok) {
                console.log('Orchestrator is ready!');
                break;
            }
        } catch (healthError) {
            console.log(`Waiting for orchestrator... (${retries} attempts left)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10 seconds
    }
    
    if (retries === 0) {
        console.log('Warning: Orchestrator not responding, will try to process anyway');
    }
    
    await main();
    
    console.log('Langchain service is now watching for changes...');
    setInterval(() => {
        console.log('Langchain service is running...');
    }, 60000);
}

runService().catch(console.error);
