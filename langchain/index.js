const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { Headers } = require('node-fetch');
const FormData = require('form-data');
const { QdrantClient } = require('@qdrant/js-client-rest');

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
                size: 768,
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
                const response = await client.upsert('documents', {
                    points: [
                        {
                            id: file,
                            vector: vector,
                            payload: { text: data }
                        }
                    ]
                });
                console.log(`✓ Successfully indexed ${file}`);
            } catch (error) {
                console.error(`✗ Error processing ${file}:`, error.message);
            }
        }
        console.log('Indexing complete!');
    } catch (error) {
        console.error('Error reading documentation directory:', error.message);
    }
}

async function getVector(text) {
    try {
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

main().catch(console.error);
