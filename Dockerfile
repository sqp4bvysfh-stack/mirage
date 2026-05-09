FROM node:22-slim
WORKDIR /app
COPY artifacts/discord-bot/package.json ./package.json
COPY artifacts/discord-bot/src ./src
COPY artifacts/discord-bot/tsconfig.json ./tsconfig.json
RUN npm pkg set dependencies.tsx="^4.21.0" && \
    npm install --omit=dev
CMD ["node", "--import", "tsx/esm", "src/index.ts"]
