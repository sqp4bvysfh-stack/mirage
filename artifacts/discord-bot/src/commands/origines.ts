import { EmbedBuilder, type Message } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

// ─── État partagé — Map panelId → config ─────────────────────────────────
export const originesPanels = new Map<string, { emoji: string; roleId: string }[]>();

// ─── Helpers ──────────────────────────────────────────────────────────────
function buildEmbed(config: { emoji: string; roleId: string }[]): EmbedBuilder {
  const lines = config.map(c => `${c.emoji}  →  <@&${c.roleId}>`).join("\n");
  return new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("🌍 Sélectionne ton origine")
    .setDescription(
      "Réagis avec le drapeau de ton pays pour obtenir le rôle correspondant.\n" +
      "Retire ta réaction pour enlever le rôle.\n\n" +
      lines
    )
    .setFooter({ text: "Un seul rôle à la fois recommandé." });
}

async function awaitReply(message: Message, prompt: Message): Promise<Message | null> {
  try {
    const collected = await message.channel.awaitMessages({
      filter: (m) => m.author.id === message.author.id,
      max:    1,
      time:   60_000,
      errors: ["time"],
    });
    return collected.first() ?? null;
  } catch {
    await prompt.delete().catch(() => {});
    await message.reply("⏰ Temps écoulé.");
    return null;
  }
}

// ─── Commande ─────────────────────────────────────────────────────────────
export const originesCommand: Command = {
  name:        "setup",
  description: "Gère les panels d'origines (*setup origines | *setup origines edit <id>)",
  usage:       "*setup origines  /  *setup origines edit <id du message>",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    if (args[0]?.toLowerCase() !== "origines") {
      await message.reply("❌ Utilise `*setup origines` ou `*setup origines edit <id>`.");
      return;
    }

    // ── Sous-commande : edit ───────────────────────────────────────────────
    if (args[1]?.toLowerCase() === "edit") {
      const panelId = args[2];
      if (!panelId) {
        await message.reply("❌ Donne l'ID du message panel. Ex : `*setup origines edit 123456789`");
        return;
      }

      const existing = originesPanels.get(panelId);
      if (!existing) {
        await message.reply("❌ Panel introuvable. L'ID est incorrect ou le bot a redémarré depuis sa création.");
        return;
      }

      const slots = 20 - existing.length;
      if (slots === 0) {
        await message.reply("❌ Ce panel est déjà à 20 origines, c'est le maximum Discord.");
        return;
      }

      // Récupérer le message du panel
      const panelMsg = await message.channel.messages.fetch(panelId).catch(() => null);
      if (!panelMsg) {
        await message.reply("❌ Impossible de récupérer le message. Vérifie que tu es dans le bon salon.");
        return;
      }

      const prompt = await message.channel.send(
        `✏️ **Modifier le panel**\n\n` +
        `Ce panel a déjà **${existing.length}/20** origines. Tu peux en ajouter jusqu'à **${slots}**.\n` +
        `Mentionne les rôles à ajouter : \`@🇨🇩 @🇬🇦 ...\`\n\n` +
        `*60 secondes. Tape \`annuler\` pour quitter.*`
      );

      const reply = await awaitReply(message, prompt);
      if (!reply) return;

      await reply.delete().catch(() => {});
      await prompt.delete().catch(() => {});

      if (reply.content.toLowerCase() === "annuler") {
        await message.reply("❌ Modification annulée.");
        return;
      }

      const newRoles = [...reply.mentions.roles.values()].slice(0, slots);
      if (newRoles.length === 0) {
        await message.reply("❌ Aucun rôle détecté.");
        return;
      }

      // Ignorer les doublons déjà présents
      const existingIds = new Set(existing.map(e => e.roleId));
      const toAdd = newRoles
        .filter(r => !existingIds.has(r.id))
        .map(r => ({ emoji: r.name, roleId: r.id }));

      if (toAdd.length === 0) {
        await message.reply("❌ Ces origines sont déjà dans le panel.");
        return;
      }

      const updated = [...existing, ...toAdd];
      originesPanels.set(panelId, updated);

      // Mettre à jour l'embed
      await panelMsg.edit({ embeds: [buildEmbed(updated)] });

      // Ajouter les nouvelles réactions
      for (const { emoji } of toAdd) {
        await panelMsg.react(emoji).catch(() => {});
      }

      await message.reply(`✅ **${toAdd.length} origine(s) ajoutée(s)** au panel ! (${updated.length}/20)`);
      return;
    }

    // ── Sous-commande : créer un nouveau panel ─────────────────────────────
    const prompt = await message.channel.send(
      "🌍 **Setup Origines**\n\n" +
      "Mentionne tous les rôles d'origine que tu veux inclure dans ce panel (max 20).\n" +
      "Exemple : `@🇫🇷 @🇲🇦 @🇩🇿 @🇧🇪`\n\n" +
      "*Tu as 60 secondes. Tape `annuler` pour quitter.*"
    );

    const reply = await awaitReply(message, prompt);
    if (!reply) return;

    await reply.delete().catch(() => {});
    await prompt.delete().catch(() => {});

    if (reply.content.toLowerCase() === "annuler") {
      await message.reply("❌ Setup annulé.");
      return;
    }

    const roles = [...reply.mentions.roles.values()].slice(0, 20);
    if (roles.length === 0) {
      await message.reply("❌ Aucun rôle détecté. Assure-toi de mentionner les rôles avec @.");
      return;
    }

    const config = roles.map(r => ({ emoji: r.name, roleId: r.id }));
    const panel  = await message.channel.send({ embeds: [buildEmbed(config)] });

    originesPanels.set(panel.id, config);

    for (const { emoji } of config) {
      await panel.react(emoji).catch(() => {});
    }

    await message.reply(
      `✅ Panel créé avec **${roles.length} origines** !\n` +
      `Pour en ajouter plus tard : \`*setup origines edit ${panel.id}\``
    );
  },
};
