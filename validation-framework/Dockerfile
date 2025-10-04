FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy source code
COPY . .

# Create directories for rules and configs
RUN mkdir -p rules configs schemas src ui

# Expose ports
EXPOSE 3001 3002 3005

# Start the application
CMD ["npm", "start"]