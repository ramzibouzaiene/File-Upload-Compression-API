FROM node:lts-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production && \
    npm install --save-dev @types/swagger-jsdoc @types/multer

COPY . .

RUN npm run build

ENV PORT=3002

EXPOSE $PORT

CMD ["node", "dist/server.js"]