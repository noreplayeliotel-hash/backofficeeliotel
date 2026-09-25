# Étape 1 : Build de l'application Vite React
FROM node:22-alpine AS build

WORKDIR /app

# Copie des fichiers de configuration et dépendances
COPY .npmrc ./
COPY package*.json ./

# Installation des dépendances avec tolérance des peer dependencies
RUN npm install --legacy-peer-deps

# Copie de tout le code source
COPY . .

# Argument d'URL API injectable depuis Coolify (Build Time)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL:-https://api.eliotel.com/api}

# Compilation TypeScript et Vite
RUN npm run build

# Étape 2 : Serveur web Nginx ultra-léger et sécurisé pour SPA
FROM nginx:alpine

# Remplacement de la configuration par défaut avec le support React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie des fichiers compilés depuis l'étape de build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
