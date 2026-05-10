import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "../types.js";

export const twerkCommand: Command = {
  name: "twerk",
  description: "Envoie un gif qui twerk",
  usage: "*twerk",
  execute: async (message) => {
    await message.delete().catch(() => {});

    const gif = readFileSync(join(process.cwd(), "assets/twerk.gif"));

    await message.channel.send({
      files: [{ attachment: gif, name: "twerk.gif" }],
    });
  },
};