import type { Command } from "../types.js";

export const sayCommand: Command = {
  name: "say",
  description: "Fait parler le bot",
  execute: async (message, args) => {
    const member = message.member;
    const estAutorisé = member?.permissions.has("ManageMessages") || member?.permissions.has("Administrator");

    if (!estAutorisé) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const texte = args.join(" ");
    if (!texte) {
      await message.reply("❌ Écris un message ! Ex: `*say Bonjour tout le monde`");
      return;
    }

    await message.delete().catch(() => {});
    await message.channel.send(texte);
  },
};