import type { Command } from "../types.js";

export const sendCommand: Command = {
  name: "send",
  description: "Envoie un média dans le salon",
  usage: "*send [texte] (+ fichier attaché)",
  execute: async (message, args) => {
    const member = message.member;
    const estAutorisé = member?.permissions.has("ManageMessages") || member?.permissions.has("Administrator");

    if (!estAutorisé) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const texte = args.join(" ");
    const attachments = [...message.attachments.values()];

    if (!texte && attachments.length === 0) {
      await message.reply("❌ Attache un fichier ou écris un message.");
      return;
    }

    const files = await Promise.all(
      attachments.map(async (a) => {
        const res = await fetch(a.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        return { attachment: buffer, name: a.name };
      })
    );

    await message.delete().catch(() => {});

    await message.channel.send({
      content: texte || undefined,
      files,
    });
  },
};