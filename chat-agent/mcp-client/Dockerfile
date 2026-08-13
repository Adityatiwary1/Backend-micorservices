FROM node:20-alpine
WORKDIR /application
COPY ./chat-agent/mcp-client/package*.json .
RUN npm ci --omit=dev
COPY ./chat-agent/mcp-client .

CMD ["npm","start"]