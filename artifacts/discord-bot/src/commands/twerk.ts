import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "../types.js";

export const twerkCommand: Command = {
  name: "twerk",
  description: "Envoie un gif qui twerk",
  usage: "*twerk",
  execute: async (message) => {
    await message.delete().catch(() => {});

    const gif = readFileSync(join(process.cwd(), "../../attached_assets/DC085010-649E-4644-8F22-221870F38AA3.gif"));

    await message.channel.send({
      files: [{ attachment: gif, name: "twerk.gif" }],
    });
  },
};