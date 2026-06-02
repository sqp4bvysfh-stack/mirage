import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Command } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GIF_PATH = join(process.cwd(), "assets/twerk.gif");
console.log("🔍 GIF path:", GIF_PATH);


export const twerkCommand: Command = {
  name: "twerk",
  description: "Envoie un gif qui twerk",
  usage: "*twerk",
  execute: async (message) => {
    await message.delete().catch(() => {});
    try {
      const gif = readFileSync(GIF_PATH);
      await message.channel.send({
        files: [{ attachment: gif, name: "twerk.gif" }],
      });
    } catch (err) {
      await message.channel.send("❌ GIF introuvable.").catch(() => {});
      console.error("twerk GIF manquant :", GIF_PATH, err);
    }
  },
};
