## TODO: This is not currently working

FROM node

COPY /Users/tom/Desktop/projects/w/models /models

COPY . /api

WORKDIR /models

RUN npm install

WORKDIR /api

RUN npm install && npm start

EXPOSE 8888