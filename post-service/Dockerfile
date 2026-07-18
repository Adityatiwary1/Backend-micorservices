FROM node:20-alpine
WORKDIR /application
COPY ./post-service/package*.json .
RUN npm ci
COPY ./post-service .

CMD ["npm","start"]