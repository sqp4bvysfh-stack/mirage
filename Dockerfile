FROM node:22-slim
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY artifacts/discord-bot ./artifacts/discord-bot
COPY lib ./lib
RUN pnpm install --no-frozen-lockfile --filter @workspace/discord-bot...
CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
