FROM node:20-alpine
WORKDIR /application
COPY ./chat-agent/mcp-server/package*.json .
RUN npm ci --omit=dev
COPY ./chat-agent/mcp-server .

CMD ["npm","start"]