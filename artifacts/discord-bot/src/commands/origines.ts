import { EmbedBuilder, type Message } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

// ─── État partagé avec index.ts ───────────────────────────────────────────
export const originesState: {
  panelId:   string | null;
  channelId: string | null;
  config:    { emoji: string; roleId: string }[];
} = {
  panelId:   null,
  channelId: null,
  config:    [],
};

// ─── Commande ─────────────────────────────────────────────────────────────
export const originesCommand: Command = {
  name:        "setup",
  description: "Initialise un panel interactif (ex: *setup origines)",
  usage:       "*setup origines",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    if (args[0]?.toLowerCase() !== "origines") {
      await message.reply("❌ Utilise `*setup origines`.");
      return;
    }

    // ── Étape 1 : demander les rôles ─────────────────────────────────────
    const prompt = await message.channel.send(
      "🌍 **Setup Origines**\n\n" +
      "Mentionne tous les rôles d'origine que tu veux inclure dans le panel.\n" +
      "Exemple : `@🇫🇷 @🇲🇦 @🇩🇿 @🇧🇪`\n\n" +
      "*Tu as 60 secondes. Tape `annuler` pour quitter.*"
    );

    // ── Étape 2 : attendre la réponse du modo ────────────────────────────
    let collected;
    try {
      collected = await message.channel.awaitMessages({
        filter:  (m) => m.author.id === message.author.id,
        max:     1,
        time:    60_000,
        errors:  ["time"],
      });
    } catch {
      await prompt.delete().catch(() => {});
      await message.reply("⏰ Temps écoulé. Refais `*setup origines`.");
      return;
    }

    const reply = collected.first()!;
    await reply.delete().catch(() => {});
    await prompt.delete().catch(() => {});

    if (reply.content.toLowerCase() === "annuler") {
      await message.reply("❌ Setup annulé.");
      return;
    }

    // ── Étape 3 : extraire les rôles mentionnés ──────────────────────────
    const roles = [...reply.mentions.roles.values()];

    if (roles.length === 0) {
      await message.reply("❌ Aucun rôle détecté. Assure-toi de mentionner les rôles avec @.");
      return;
    }

    // Construire la config : nom du rôle = emoji du drapeau
    originesState.config    = roles.map(r => ({ emoji: r.name, roleId: r.id }));
    originesState.channelId = message.channelId;

    // ── Étape 4 : créer le panel ──────────────────────────────────────────
    const lines = roles.map(r => `${r.name}  →  <@&${r.id}>`).join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🌍 Sélectionne ton origine")
      .setDescription(
        "Réagis avec le drapeau de ton pays pour obtenir le rôle correspondant.\n" +
        "Retire ta réaction pour enlever le rôle.\n\n" +
        lines
      )
      .setFooter({ text: "Un seul rôle à la fois recommandé." });

    const panel = await message.channel.send({ embeds: [embed] });
    originesState.panelId = panel.id;

    for (const { emoji } of originesState.config) {
      await panel.react(emoji).catch(() => {});
    }

    await message.reply(`✅ Panel des origines créé avec **${roles.length} origines** !`);
  },
};
