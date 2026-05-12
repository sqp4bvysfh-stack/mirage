import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt, TYCOON } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";

function calcPending(tycoonLevel: number, tycoonLastCollect: number): number {
  const lvl     = TYCOON[tycoonLevel];
  if (!lvl) return 0;
  const elapsed = Date.now() - tycoonLastCollect;
  const hours   = elapsed / 3_600_000;
  return Math.floor(lvl.rate * Math.min(hours, 48)); // cap 48h
}

export const tycoonCommand: Command = {
  name: "tycoon",
  description: "Gère ton business passif",
  usage: "&tycoon [upgrade|collect]",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    const sub     = args[0]?.toLowerCase();

    // ── collect ───────────────────────────────────────────────────────────────
    if (sub === "collect") {
      const gain = calcPending(u.tycoonLevel, u.tycoonLastCollect);
      if (gain <= 0) { await message.reply("❌ Rien à collecter pour l'instant."); return; }
      u.poche += gain;
      u.totalEarned += gain;
      u.tycoonLastCollect = Date.now();
      saveUser(guildId, userId, u);
      await message.reply(`💼 Tu collectes ${fmt(gain, cfg.monnaie)} de ton business !`);
      return;
    }

    // ── upgrade ───────────────────────────────────────────────────────────────
    if (sub === "upgrade") {
      const next = TYCOON[u.tycoonLevel + 1];
      if (!next) { await message.reply("🏆 Ton business est déjà au niveau maximum — **Empire** !"); return; }
      if (u.poche < next.cost!) {
        await message.reply(`❌ Poche insuffisante. Il faut ${fmt(next.cost!, cfg.monnaie)} (tu as ${fmt(u.poche, cfg.monnaie)}).`);
        return;
      }
      const pending = calcPending(u.tycoonLevel, u.tycoonLastCollect);
      if (pending > 0) {
        u.poche += pending;
        u.totalEarned += pending;
      }
      u.poche -= next.cost!;
      u.tycoonLevel++;
      u.tycoonLastCollect = Date.now();
      saveUser(guildId, userId, u);
      await message.reply(`🎉 Business upgradé → **${next.name}** (${next.rate.toLocaleString("fr-FR")} ${cfg.monnaie}/h) !`);
      return;
    }

    // ── voir ──────────────────────────────────────────────────────────────────
    const lvl     = TYCOON[u.tycoonLevel]!;
    const next    = TYCOON[u.tycoonLevel + 1];
    const pending = calcPending(u.tycoonLevel, u.tycoonLastCollect);
    const embed   = new EmbedBuilder()
      .setColor(0xe67e22)
      .setTitle("🏗️ Ton Tycoon")
      .addFields(
        { name: "Business actuel", value: `**${lvl.name}** (niveau ${u.tycoonLevel})`, inline: true },
        { name: "Revenus",         value: `${lvl.rate.toLocaleString("fr-FR")} ${cfg.monnaie}/h`, inline: true },
        { name: "À collecter",     value: fmt(pending, cfg.monnaie), inline: true },
        { name: "Prochain niveau", value: next ? `**${next.name}** — ${fmt(next.cost!, cfg.monnaie)}` : "*Niveau max*", inline: false },
      )
      .setFooter({ text: "&tycoon collect pour récupérer | &tycoon upgrade pour monter de niveau" })
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};
