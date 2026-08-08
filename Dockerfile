FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy remaining source code
COPY . .

# Build frontend if needed
RUN npm install && npm run build

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]