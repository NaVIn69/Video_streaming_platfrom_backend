# base image of nodejs 
FROM node:24.12.0-slim

#set the working dir inside the container
WORKDIR /usr/src/app

# copy all the dependency from Package.json
COPY package*.json ./

#install all the dependencies to the container
RUN npm install

#copy rest of app source code to the container
COPY . .

#EXPOSE the PORT inside the container
EXPOSE 3000

#the command to run the container
CMD ["npm","run","dev"]
