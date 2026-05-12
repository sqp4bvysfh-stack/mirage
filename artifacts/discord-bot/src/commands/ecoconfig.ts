import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getEcoConfig, setEcoConfig } from "../utils/ecoConfig.js";
import { BOT_OWNER_ID } from "./owner.js";

export const ecoconfigCommand: Command = {
  name: "ecoconfig",
  description: "Configuration du système économique (admin)",
  usage: "&ecoconfig <monnaie|daily|work|voir>",
  execute: async (message, args) => {
    const isAdmin  = message.member?.permissions.has("Administrator");
    const isOwner  = message.author.id === BOT_OWNER_ID;
    if (!isAdmin && !isOwner) { await message.reply("❌ Réservé aux administrateurs."); return; }

    const guildId = message.guild!.id;
    const sub     = args[0]?.toLowerCase();
    const cfg     = getEcoConfig(guildId);

    // ── voir ──────────────────────────────────────────────────────────────────
    if (!sub || sub === "voir") {
      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("⚙️ Config Économie")
        .addFields(
          { name: "Monnaie",    value: cfg.monnaie,                                     inline: true },
          { name: "Daily",      value: `${cfg.dailyMin} – ${cfg.dailyMax}`,             inline: true },
          { name: "Work",       value: `${cfg.workMin} – ${cfg.workMax}`,               inline: true },
        )
        .setFooter({ text: "&ecoconfig monnaie <symbole> | &ecoconfig daily <min> <max> | &ecoconfig work <min> <max>" });
      await message.reply({ embeds: [embed] });
      return;
    }

    // ── monnaie ───────────────────────────────────────────────────────────────
    if (sub === "monnaie") {
      const val = args[1];
      if (!val) { await message.reply("❌ Usage : `&ecoconfig monnaie <symbole>`"); return; }
      setEcoConfig(guildId, { monnaie: val });
      await message.reply(`✅ Monnaie changée en **${val}** !`);
      return;
    }

    // ── daily ─────────────────────────────────────────────────────────────────
    if (sub === "daily") {
      const min = parseInt(args[1] ?? "");
      const max = parseInt(args[2] ?? "");
      if (isNaN(min) || isNaN(max) || min <= 0 || max <= min) {
        await message.reply("❌ Usage : `&ecoconfig daily <min> <max>` (min < max, tous positifs)"); return;
      }
      setEcoConfig(guildId, { dailyMin: min, dailyMax: max });
      await message.reply(`✅ Daily configuré : **${min} – ${max}** ${cfg.monnaie}`);
      return;
    }

    // ── work ──────────────────────────────────────────────────────────────────
    if (sub === "work") {
      const min = parseInt(args[1] ?? "");
      const max = parseInt(args[2] ?? "");
      if (isNaN(min) || isNaN(max) || min <= 0 || max <= min) {
        await message.reply("❌ Usage : `&ecoconfig work <min> <max>` (min < max, tous positifs)"); return;
      }
      setEcoConfig(guildId, { workMin: min, workMax: max });
      await message.reply(`✅ Work configuré : **${min} – ${max}** ${cfg.monnaie}`);
      return;
    }

    await message.reply("❌ Usage : `&ecoconfig <monnaie|daily|work|voir>`");
  },
};
