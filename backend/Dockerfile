FROM node:20-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN yarn build

# Create data directory for database
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Run migrations and start the application
CMD ["sh", "-c", "NODE_ENV=production yarn migration:run && yarn start"]
