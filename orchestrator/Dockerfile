FROM node:18

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Environment variables
# ENV POSTGRES_HOST=postgres
# ENV POSTGRES_USER=postgres
# ENV POSTGRES_PASSWORD=postgres
# ENV POSTGRES_DB=call_center
# ENV QDRANT_HOST=qdrant

EXPOSE 3000

CMD ["node", "server.js"]
