FROM node:24-bookworm

# Set the working directory
WORKDIR /app/lifeforce

# Copy package.json and package-lock.json
COPY package.json package.json
COPY package-lock.json package-lock.json
COPY tsconfig.json tsconfig.json
COPY .eslintrc.json .eslintrc.json
COPY prisma/schema.prisma prisma/schema.prisma
COPY prisma/migrations prisma/migrations

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY src src
COPY static static

# Run the typescript build
RUN npm run build

# Start the application
CMD [ "npm", "start" ]
