FROM node

ENV NODE_ENV=development

RUN mkdir api api/config

VOLUME [ "/Users/eats/Desktop/projects/Llamas/lottallamas-api:/api" ]

WORKDIR /api

COPY package*.json ./

COPY /config/config.json /api/config/config.json

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install

ENV PATH=/api/node_modules/.bin:$PATH

# CMD ["node", "server.js"]

EXPOSE 3100

