FROM node:22-slim
WORKDIR /app

COPY artifacts/discord-bot/src ./src
COPY artifacts/discord-bot/tsconfig.json ./tsconfig.json

RUN node -e "require('fs').writeFileSync('package.json', JSON.stringify({ \
  name: 'discord-bot', \
  version: '1.0.0', \
  type: 'module', \
  dependencies: { \
    'discord.js': '^14.16.3', \
    'groq-sdk': '^1.1.2', \
    'tsx': '^4.21.0' \
  } \
}, null, 2))"

RUN npm install --omit=dev

CMD ["node_modules/.bin/tsx", "src/index.ts"]
