FROM node:20-alpine
WORKDIR /application
COPY user_service/package*.json .
RUN npm ci
COPY ./user_service .

CMD ["npm","start"]
