import {
  ChannelType,
  type Message,
  type TextChannel,
  type AttachmentBuilder,
} from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

export const talkCommand: Command = {
  name:        "talk",
  description: "Envoie un message en tant que MIRAGE (formatage préservé + image optionnelle)",
  usage:       "*talk [#salon]",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    // ── Salon cible ────────────────────────────────────────────────────────
    const cible = (message.mentions.channels.first() as TextChannel | undefined)
      ?? (message.channel as TextChannel);

    // Supprimer la commande d'origine pour rester discret
    await message.delete().catch(() => {});

    // ── Étape 1 : demander le message ─────────────────────────────────────
    const promptMsg = await message.channel.send(
      `📝 **Talk — Étape 1/2**\n\n` +
      `Écris le message que tu veux envoyer dans ${cible}.\n` +
      `*(Tes retours à la ligne et espaces seront conservés — tu as 5 min. Tape \`annuler\` pour quitter.)*`
    );

    let contenu: string;
    try {
      const col = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max:    1,
        time:   300_000,
        errors: ["time"],
      });
      const rep = col.first()!;
      contenu = rep.content;
      await rep.delete().catch(() => {});
    } catch {
      await promptMsg.delete().catch(() => {});
      await message.channel.send("⏰ Temps écoulé.").catch(() => {});
      return;
    }

    await promptMsg.delete().catch(() => {});

    if (contenu.toLowerCase() === "annuler") {
      await message.channel.send("❌ Annulé.").then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
      return;
    }

    // ── Étape 2 : demander l'image ────────────────────────────────────────
    const promptImg = await message.channel.send(
      `🖼️ **Talk — Étape 2/2**\n\n` +
      `Tu veux joindre une image ? Envoie-la maintenant, ou tape \`non\`.\n` +
      `*(2 min)*`
    );

    let imageUrl: string | null = null;
    try {
      const col = await message.channel.awaitMessages({
        filter: (m) => m.author.id === message.author.id,
        max:    1,
        time:   120_000,
        errors: ["time"],
      });
      const rep = col.first()!;

      if (rep.content.toLowerCase() !== "non") {
        const attachment = rep.attachments.first();
        if (attachment) {
          imageUrl = attachment.url;
        }
      }
      await rep.delete().catch(() => {});
    } catch {
      // Pas d'image si timeout — on continue quand même
    }

    await promptImg.delete().catch(() => {});

    // ── Envoi dans le salon cible ─────────────────────────────────────────
    await cible.send({
      content: contenu,
      ...(imageUrl ? { files: [imageUrl] } : {}),
    });
  },
};
