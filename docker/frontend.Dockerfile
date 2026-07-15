FROM node:18-alpine

WORKDIR /app

# Copy package configurations
COPY frontend/package.json ./package.json
RUN npm install

# Copy source assets
COPY frontend/ ./

# Build site
RUN npm run build

# Expose port
EXPOSE 5173

# Serve static assets
CMD ["npm", "run", "preview"]
