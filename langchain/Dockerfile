FROM node:18

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create documentation directory
RUN mkdir -p documentation

CMD ["node", "index.js"]
