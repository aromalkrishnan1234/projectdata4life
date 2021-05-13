FROM node: latest
WORKDIR /app
COPY package.json /app
RUN npm install
COPY .  ./
EXPOSE 3030
CMD ["node , "Server.js"]
