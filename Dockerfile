FROM node

ENV NODE_ENV=development

RUN mkdir var/llamas var/llamas/api var/llamas/api/config

VOLUME [ "/Users/eats/Desktop/projects/Llamas/lottallamas-api:/var/llamas/api", "/Users/eats/Desktop/projects/Llamas/lottallamas-models:/var/llamas/models" ]

WORKDIR /var/llamas/api

COPY package*.json ./

COPY /config/config.json /var/llamas/api/config/config.json

RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm install

ENV PATH=/var/llamas/api/node_modules/.bin:$PATH

CMD ["nodemon", "server.js"]

EXPOSE 3100 5432
