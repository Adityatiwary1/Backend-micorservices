FROM node:20-alpine
WORKDIR /application
COPY ./media-service/package*.json .
RUN npm ci
COPY ./media-service .

CMD ["npm","start"]