FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG GIT_SHA
ENV VITE_GIT_SHA=$GIT_SHA

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 5000

CMD [ "npm", "start" ]