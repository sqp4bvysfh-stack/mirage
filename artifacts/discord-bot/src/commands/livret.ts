import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt, applyLivretInterets, LIVRET_TAUX } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";

export const livretCommand: Command = {
  name: "livret",
  description: "Livret d'épargne — 2%/24h automatiques",
  usage: "&livret [dep|with] [montant|all]",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    let u         = getUser(guildId, userId);
    u             = applyLivretInterets(u);

    const sub = args[0]?.toLowerCase();

    // ── dep ───────────────────────────────────────────────────────────────────
    if (sub === "dep" || sub === "deposit") {
      const raw = args[1]?.toLowerCase();
      const amt = raw === "all" ? u.poche : parseInt(raw ?? "");
      if (isNaN(amt) || amt <= 0) { saveUser(guildId, userId, u); await message.reply("❌ Usage : `&livret dep <montant|all>`"); return; }
      if (u.poche < amt) { saveUser(guildId, userId, u); await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return; }
      u.poche  -= amt;
      u.livret += amt;
      u.livretLastUpdate = Date.now();
      saveUser(guildId, userId, u);
      await message.reply(`🏧 ${fmt(amt, cfg.monnaie)} déposés sur ton livret. Livret : ${fmt(u.livret, cfg.monnaie)}`);
      return;
    }

    // ── with ──────────────────────────────────────────────────────────────────
    if (sub === "with" || sub === "withdraw") {
      const raw = args[1]?.toLowerCase();
      const amt = raw === "all" ? u.livret : parseInt(raw ?? "");
      if (isNaN(amt) || amt <= 0) { saveUser(guildId, userId, u); await message.reply("❌ Usage : `&livret with <montant|all>`"); return; }
      if (u.livret < amt) { saveUser(guildId, userId, u); await message.reply(`❌ Livret insuffisant (${fmt(u.livret, cfg.monnaie)}).`); return; }
      u.livret -= amt;
      u.poche  += amt;
      saveUser(guildId, userId, u);
      await message.reply(`👜 ${fmt(amt, cfg.monnaie)} retirés du livret. Poche : ${fmt(u.poche, cfg.monnaie)}`);
      return;
    }

    // ── voir ──────────────────────────────────────────────────────────────────
    saveUser(guildId, userId, u);
    const gainJour = Math.floor(u.livret * LIVRET_TAUX);
    const embed = new EmbedBuilder()
      .setColor(0x1abc9c)
      .setTitle("🏧 Ton Livret")
      .addFields(
        { name: "Solde",          value: fmt(u.livret, cfg.monnaie), inline: true },
        { name: "Taux",           value: "2% / 24h",                  inline: true },
        { name: "Gain estimé/j",  value: fmt(gainJour, cfg.monnaie), inline: true },
      )
      .setFooter({ text: "Les intérêts s'appliquent automatiquement à chaque consultation." })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
