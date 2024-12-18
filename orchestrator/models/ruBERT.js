import { pipeline } from '@xenova/transformers';

class RuBERT {
    constructor() {
        this.model = null;
        this.modelName = 'DeepPavlov/rubert-base-cased';
    }

    async initialize() {
        if (!this.model) {
            this.model = await pipeline('feature-extraction', this.modelName);
        }
    }

    async getVector(text) {
        try {
            await this.initialize();
            const output = await this.model(text, {
                pooling: 'mean',
                normalize: true
            });
            
            return Array.from(output.data);
        } catch (error) {
            console.error('Error in getVector:', error);
            throw error;
        }
    }
}

export default new RuBERT();
