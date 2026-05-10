import { EmbedBuilder, type Message } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";
import {
  getConfig,
  setConfig,
  extractId,
  exportConfigJson,
  CONFIG_DESCRIPTIONS,
  type ConfigKey,
} from "../utils/serverConfig.js";

const VALID_KEYS = Object.keys(CONFIG_DESCRIPTIONS) as ConfigKey[];

export const configCommand: Command = {
  name:        "config",
  description: "Configurer le bot pour ce serveur",
  usage:       "*config set <clé> <valeur>  |  *config list",

  execute: async (message: Message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const guildId = message.guild!.id;
    const sub     = args[0]?.toLowerCase();

    // ── *config list ───────────────────────────────────────────────────────
    if (!sub || sub === "list") {
      const cfg    = getConfig(guildId);
      const lines  = VALID_KEYS.map(k => {
        const val = cfg[k];
        return `**${CONFIG_DESCRIPTIONS[k]}** (\`${k}\`)\n> ${val ? `\`${val}\`` : "*non configuré*"}`;
      }).join("\n");

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("⚙️ Configuration du serveur")
        .setDescription(lines)
        .setFooter({ text: "Modifie avec : *config set <clé> <valeur>" });

      await message.reply({ embeds: [embed] });
      return;
    }

    // ── *config set <clé> <valeur> ─────────────────────────────────────────
    if (sub === "set") {
      const key   = args[1] as ConfigKey | undefined;
      const raw   = args.slice(2).join(" ").trim();

      if (!key || !VALID_KEYS.includes(key)) {
        const liste = VALID_KEYS.map(k => `\`${k}\``).join(", ");
        await message.reply(`❌ Clé invalide. Clés disponibles :\n${liste}`);
        return;
      }

      if (!raw) {
        await message.reply(`❌ Donne une valeur. Ex : \`*config set ${key} <valeur ou @mention ou #salon>\``);
        return;
      }

      const value = extractId(raw);
      setConfig(guildId, key, value);

      await message.reply(
        `✅ **${CONFIG_DESCRIPTIONS[key]}** défini à \`${value}\`\n` +
        `*(sauvegardé — actif immédiatement)*`
      );
      return;
    }

    // ── *config export ─────────────────────────────────────────────────────
    if (sub === "export") {
      const json = exportConfigJson();
      await message.reply(
        `✅ **Copie ce JSON et colle-le dans la variable \`BOT_CONFIG\` sur Railway.**\n` +
        `Elle sera chargée automatiquement à chaque redémarrage.\n\`\`\`json\n${json}\n\`\`\``
      );
      return;
    }

    await message.reply("❌ Sous-commande inconnue. Utilise `*config list`, `*config set <clé> <valeur>` ou `*config export`.");
  },
};
