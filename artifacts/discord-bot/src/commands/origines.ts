import { EmbedBuilder, type Message } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

// ─── Config : emoji → rôle ID ──────────────────────────────────────────────
// Remplis les IDs de rôles correspondants à chaque drapeau
export const ORIGINES_CONFIG: { emoji: string; label: string; roleId: string }[] = [
  { emoji: "🇫🇷", label: "France",       roleId: "ROLE_ID_FRANCE" },
  { emoji: "🇧🇪", label: "Belgique",     roleId: "ROLE_ID_BELGIQUE" },
  { emoji: "🇨🇭", label: "Suisse",       roleId: "ROLE_ID_SUISSE" },
  { emoji: "🇲🇦", label: "Maroc",        roleId: "ROLE_ID_MAROC" },
  { emoji: "🇩🇿", label: "Algérie",      roleId: "ROLE_ID_ALGERIE" },
  { emoji: "🇹🇳", label: "Tunisie",      roleId: "ROLE_ID_TUNISIE" },
  { emoji: "🇨🇮", label: "Côte d'Ivoire", roleId: "ROLE_ID_CDI" },
  { emoji: "🇸🇳", label: "Sénégal",      roleId: "ROLE_ID_SENEGAL" },
  { emoji: "🇨🇲", label: "Cameroun",     roleId: "ROLE_ID_CAMEROUN" },
  { emoji: "🇪🇸", label: "Espagne",      roleId: "ROLE_ID_ESPAGNE" },
  { emoji: "🇵🇹", label: "Portugal",     roleId: "ROLE_ID_PORTUGAL" },
  { emoji: "🇮🇹", label: "Italie",       roleId: "ROLE_ID_ITALIE" },
];

// État mutable partagé (module singleton — la référence est partagée avec index.ts)
export const originesState = { panelId: null as string | null };

export const originesCommand: Command = {
  name:        "setup",
  description: "Initialise un panel de sélection (ex: *setup origines)",
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

    const description = ORIGINES_CONFIG
      .map(o => `${o.emoji}  **${o.label}**`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle("🌍 Sélectionne ton origine")
      .setDescription(
        "Réagis avec le drapeau de ton pays pour obtenir le rôle correspondant.\n" +
        "Retire ta réaction pour enlever le rôle.\n\n" + description,
      )
      .setFooter({ text: "Un seul rôle à la fois recommandé." });

    const panel = await message.channel.send({ embeds: [embed] });
    originesState.panelId = panel.id;

    for (const { emoji } of ORIGINES_CONFIG) {
      await panel.react(emoji).catch(() => {});
    }

    await message.reply("✅ Panel des origines initialisé !");
  },
};
