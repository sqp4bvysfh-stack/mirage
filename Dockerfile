FROM node:22-slim
WORKDIR /app
RUN npm install -g pnpm@9
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY artifacts/discord-bot ./artifacts/discord-bot
COPY lib ./lib
RUN node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json','utf8'));delete p.scripts.preinstall;fs.writeFileSync('package.json',JSON.stringify(p,null,2))"
RUN pnpm install --no-frozen-lockfile --filter @workspace/discord-bot...
CMD ["pnpm", "--filter", "@workspace/discord-bot", "run", "start"]
