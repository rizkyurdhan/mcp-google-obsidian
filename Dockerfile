FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY tsconfig.json ./
COPY tsup.config.ts ./
COPY src/ ./src/

# Build
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV MCP_TRANSPORT=http
ENV MCP_HTTP_PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.js"]