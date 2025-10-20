FROM node:20-alpine
WORKDIR /app
RUN npm i -g pnpm
COPY package*.json .
COPY . .
RUN pnpm i --frozen-lockfile && pnpm build
EXPOSE 5173
CMD ["pnpm", "preview", "--host"]