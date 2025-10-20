FROM node:20-alpine as base
WORKDIR /app
COPY package*.json .
RUN npm i -g pnpm
COPY . .
RUN pnpm i --frozen-lockfile && pnpm build || echo "skip build if using ts-node"
EXPOSE 4000
CMD ["node", "dist/index.js"]