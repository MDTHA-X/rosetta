FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy remaining source code
COPY . .

# Change 5000 to whatever port your server.js listens on (e.g., 3000 or 5000)
EXPOSE 5000

CMD ["node", "server.js"]