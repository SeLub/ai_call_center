import express from 'express';
import bcrypt from 'bcrypt';
import { QdrantClient } from '@qdrant/js-client-rest';
import ruBERT from './models/ruBERT.js';
import db from './db.js';

const app = express();
app.use(express.json());

// Initialize Qdrant client
const qdrantClient = new QdrantClient({ 
    url: `http://${process.env.QDRANT_HOST || 'qdrant'}:6333` 
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Vector embedding endpoint
app.post('/vector', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const vector = await ruBERT.getVector(text);
        res.json({ vector });
    } catch (error) {
        console.error('Error processing vector:', error);
        res.status(500).json({ error: error.message });
    }
});

// Authorization endpoint
app.post('/authorize', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ 
            authorized: false, 
            message: "Username and password are required" 
        });
    }

    try {
        const { rows } = await db.query(
            'SELECT password_hash FROM users WHERE username = $1',
            [username]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                authorized: false, 
                message: "Пользователь не найден" 
            });
        }

        const storedHash = rows[0].password_hash;

        // First try exact password match
        const isMatch = await bcrypt.compare(password, storedHash);
        if (isMatch) {
            return res.status(200).json({ 
                authorized: true, 
                message: "Авторизация успешна" 
            });
        }

        // If exact match fails, try semantic similarity
        try {
            const isModelMatch = await classifyText(password, "password123");
            if (isModelMatch) {
                return res.status(200).json({ 
                    authorized: true, 
                    message: "Авторизация успешна" 
                });
            }
        } catch (modelError) {
            console.error('Model matching error:', modelError);
        }

        // If both checks fail, return unauthorized
        return res.status(401).json({ 
            authorized: false, 
            message: "Неверный пароль" 
        });
    } catch (err) {
        console.error('Authorization error:', err);
        return res.status(500).json({ 
            authorized: false, 
            message: "Internal server error" 
        });
    }
});

// Search in vectors endpoint
app.post('/search', async (req, res) => {
    try {
        const { text, limit = 5 } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const vector = await ruBERT.getVector(text);
        const searchResult = await qdrantClient.search('documents', {
            vector: vector,
            limit: limit,
            with_payload: true
        });

        res.json({ results: searchResult });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add document endpoint
app.post('/documents', async (req, res) => {
    try {
        const { text, metadata = {} } = req.body;
        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const vector = await ruBERT.getVector(text);
        const id = Date.now().toString();
        
        await qdrantClient.upsert('documents', {
            points: [{
                id: id,
                vector: vector,
                payload: {
                    text: text,
                    ...metadata
                }
            }]
        });

        res.json({ 
            message: 'Document added successfully', 
            id: id 
        });
    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete document endpoint
app.delete('/documents/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await qdrantClient.delete('documents', {
            points: [id]
        });

        res.json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function for semantic text classification
async function classifyText(prompt, correctPassword) {
    try {
        const inputText = `${prompt} ${correctPassword}`;
        const vector = await ruBERT.getVector(inputText);
        
        const score = calculateSimilarity(vector, await ruBERT.getVector(correctPassword));
        return score > 0.5;
    } catch (error) {
        console.error('Classification error:', error);
        throw error;
    }
}

// Helper function to calculate cosine similarity
function calculateSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (mag1 * mag2);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Orchestrator service running on port ${PORT}`);
});
