import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

export const pollCommand: Command = {
  name: "poll",
  description: "Créer un sondage",
  usage: '*poll "question" "choix1" "choix2"',
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const content = message.content.slice("*poll".length).trim();
    const matches = content.match(/"([^"]+)"/g);

    if (!matches || matches.length < 3) {
      await message.reply('❌ Format : `*poll "question" "choix1" "choix2" ...`\nMinimum 2 choix requis.');
      return;
    }

    const question = matches[0].replace(/"/g, "");
    const choix = matches.slice(1).map(m => m.replace(/"/g, ""));

    if (choix.length > 10) {
      await message.reply("❌ Maximum 10 choix.");
      return;
    }

    const description = choix.map((c, i) => `${EMOJIS[i]} ${c}`).join("\n\n");

    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle("📊 " + question)
      .setDescription(description)
      .setFooter({ text: "Sondage créé par " + message.author.tag })
      .setTimestamp();

    const pollMsg = await message.channel.send({ embeds: [embed] });
    await message.delete().catch(() => {});

    for (let i = 0; i < choix.length; i++) {
      await pollMsg.react(EMOJIS[i]);
    }
  },
};
