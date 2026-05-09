FROM node:22-slim
WORKDIR /app
COPY artifacts/discord-bot/package.json ./package.json
COPY artifacts/discord-bot/src ./src
COPY artifacts/discord-bot/tsconfig.json ./tsconfig.json
RUN node -e "\
const fs=require('fs');\
const p=JSON.parse(fs.readFileSync('package.json','utf8'));\
const versions={'tsx':'^4.21.0','@types/node':'^25.3.3'};\
for(const s of ['dependencies','devDependencies']){\
  if(p[s])for(const k of Object.keys(p[s]))if(p[s][k]==='catalog:')p[s][k]=versions[k]||'*';\
}\
fs.writeFileSync('package.json',JSON.stringify(p,null,2));\
" && npm install --omit=dev
CMD ["node_modules/.bin/tsx", "src/index.ts"]
