FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci
RUN cd server && npm ci

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/python3 /usr/bin/python

# Verify Python is working
RUN python --version

# Copy server directory
COPY server/ ./server/

# Explicitly copy the SQLite database file
COPY server/src/otodom_parser/otodom.db ./server/src/otodom_parser/

# Diagnostic command to verify the database file is present
RUN ls -la ./server/src/otodom_parser/

# Expose port
EXPOSE 3000

# Start only the backend server
CMD ["npm", "run", "server"]