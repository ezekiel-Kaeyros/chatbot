# Use Node 16 alpine as parent image
FROM node:16-alpine

# Change the working directory on the Docker image to /app
WORKDIR /app

# Copy package.json and package-lock.json to the /app directory
COPY package.json ./

# RUN npm install -g npm@10.4.0

# Install dependencies
RUN yarn

# RUN npm install -g typescript

# Copy the rest of project files into this image
COPY . .



# Build the project
RUN npm run build

# Expose application port
EXPOSE 3300

# Start the application
CMD ["npm", "start"]