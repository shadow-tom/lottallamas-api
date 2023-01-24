FROM node

COPY . /api

WORKDIR /api

RUN --mount=type=secret,id=npm,target=/root/.npmrc npm install

CMD ["node", "server.js"]

EXPOSE 3100