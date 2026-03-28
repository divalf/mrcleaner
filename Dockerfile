# Etapa 1: Build
FROM node:22.12-alpine AS builder
WORKDIR /app
COPY mister-cleaner-app/package*.json ./
RUN npm ci
COPY mister-cleaner-app/ .
RUN npm run build

# Etapa 2: Servir com Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
