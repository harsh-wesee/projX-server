FROM node:14
COPY package.json .
RUN npm install
COPY . .
CMD npm start