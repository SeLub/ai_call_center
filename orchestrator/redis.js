import { createClient } from 'redis';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const CONVERSATION_TTL = parseInt(process.env.CONVERSATION_TTL) || 86400; // 24 hours

class RedisClient {
    constructor() {
        this.client = createClient({
            url: `redis://${REDIS_HOST}:${REDIS_PORT}`
        });
        
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err);
        });
        
        this.connected = false;
    }

    async connect() {
        if (!this.connected) {
            await this.client.connect();
            this.connected = true;
            console.log('Redis connected successfully');
        }
    }

    async addToConversation(sessionId, question, answer) {
        await this.connect();
        
        const conversationKey = `conversation:${sessionId}`;
        const entry = {
            question,
            answer,
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation history (keep last 10 entries)
        await this.client.lPush(conversationKey, JSON.stringify(entry));
        await this.client.lTrim(conversationKey, 0, 9); // Keep only last 10
        await this.client.expire(conversationKey, CONVERSATION_TTL);
    }

    async getConversationHistory(sessionId, limit = 5) {
        await this.connect();
        
        const conversationKey = `conversation:${sessionId}`;
        const history = await this.client.lRange(conversationKey, 0, limit - 1);
        
        return history.map(entry => JSON.parse(entry)).reverse(); // Oldest first
    }

    async clearConversation(sessionId) {
        await this.connect();
        
        const conversationKey = `conversation:${sessionId}`;
        await this.client.del(conversationKey);
    }
}

const redisClient = new RedisClient();
export default redisClient;