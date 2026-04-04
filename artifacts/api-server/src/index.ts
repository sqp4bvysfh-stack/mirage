import { spawn } from "node:child_process";
import { resolve } from "node:path";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Démarrer le bot Discord en parallèle
const workspaceRoot = resolve(import.meta.dirname, "../../..");
const botEnv = { ...process.env, BOT_PORT: "3001" };

const bot = spawn(
  "pnpm",
  ["--filter", "@workspace/discord-bot", "run", "start"],
  {
    cwd: workspaceRoot,
    stdio: "inherit",
    env: botEnv,
  },
);

bot.on("error", (err) => {
  logger.error({ err }, "Erreur lors du démarrage du bot Discord");
});

bot.on("exit", (code, signal) => {
  logger.warn({ code, signal }, "Le bot Discord s'est arrêté — redémarrage...");
  // Relancer le processus entier si le bot plante
  process.exit(1);
});

logger.info("🤖 Bot Discord démarré en parallèle");
