import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt, cryptoPrice, CRYPTO_BASE } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";

const COINS = Object.keys(CRYPTO_BASE);

function fmtCrypto(qty: number, coin: string): string {
  if (qty < 0.0001) return `${qty.toExponential(2)} ${coin}`;
  return `${parseFloat(qty.toFixed(6))} ${coin}`;
}

export const cryptoCommand: Command = {
  name: "crypto",
  description: "Trading de crypto simulé",
  usage: "&crypto [buy|sell|portfolio] ...",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const sub     = args[0]?.toLowerCase();

    // ── marché ────────────────────────────────────────────────────────────────
    if (!sub || sub === "market") {
      const lines = COINS.map(c => {
        const p = cryptoPrice(c);
        return `**${c}** — ${fmt(p, cfg.monnaie)}`;
      });
      await message.reply({ embeds: [
        new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle("📈 Marché Crypto")
          .setDescription(lines.join("\n"))
          .setFooter({ text: "Prix mis à jour toutes les 5 min" })
          .setTimestamp(),
      ] });
      return;
    }

    // ── buy ───────────────────────────────────────────────────────────────────
    if (sub === "buy") {
      const coin   = args[1]?.toUpperCase();
      const budget = parseInt(args[2] ?? "");
      if (!coin || !COINS.includes(coin) || isNaN(budget) || budget <= 0) {
        await message.reply(`❌ Usage : \`&crypto buy <coin> <montant>\`\nCoins : ${COINS.join(", ")}`); return;
      }
      const u = getUser(guildId, userId);
      if (u.poche < budget) { await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return; }
      const price = cryptoPrice(coin);
      const qty   = budget / price;
      u.poche     -= budget;
      u.crypto[coin] = (u.crypto[coin] ?? 0) + qty;
      saveUser(guildId, userId, u);
      await message.reply(`✅ Acheté **${fmtCrypto(qty, coin)}** pour ${fmt(budget, cfg.monnaie)} (prix : ${fmt(price, cfg.monnaie)}/${coin}).`);
      return;
    }

    // ── sell ──────────────────────────────────────────────────────────────────
    if (sub === "sell") {
      const coin = args[1]?.toUpperCase();
      const u    = getUser(guildId, userId);
      if (!coin || !COINS.includes(coin)) {
        await message.reply(`❌ Usage : \`&crypto sell <coin> <quantité|all>\`\nCoins : ${COINS.join(", ")}`); return;
      }
      const held   = u.crypto[coin] ?? 0;
      if (held <= 0) { await message.reply(`❌ Tu n'as pas de ${coin}.`); return; }
      const rawQty = args[2]?.toLowerCase();
      const qty    = rawQty === "all" ? held : parseFloat(rawQty ?? "");
      if (isNaN(qty) || qty <= 0 || qty > held) {
        await message.reply(`❌ Quantité invalide. Tu as ${fmtCrypto(held, coin)}.`); return;
      }
      const price = cryptoPrice(coin);
      const gain  = Math.floor(qty * price);
      u.poche    += gain;
      u.totalEarned += gain;
      u.crypto[coin] = held - qty;
      if (u.crypto[coin]! < 0.000001) delete u.crypto[coin];
      saveUser(guildId, userId, u);
      await message.reply(`✅ Vendu **${fmtCrypto(qty, coin)}** pour ${fmt(gain, cfg.monnaie)} (prix : ${fmt(price, cfg.monnaie)}/${coin}).`);
      return;
    }

    // ── portfolio ─────────────────────────────────────────────────────────────
    if (sub === "portfolio") {
      const u     = getUser(guildId, userId);
      const items = Object.entries(u.crypto).filter(([, q]) => q > 0.000001);
      if (!items.length) { await message.reply("Tu n'as pas de crypto."); return; }
      let totalVal = 0;
      const lines = items.map(([coin, qty]) => {
        const p   = cryptoPrice(coin);
        const val = Math.floor(qty * p);
        totalVal += val;
        return `**${coin}** ${fmtCrypto(qty, coin)} → ${fmt(val, cfg.monnaie)}`;
      });
      lines.push(`\n💰 **Total estimé : ${fmt(totalVal, cfg.monnaie)}**`);
      await message.reply({ embeds: [
        new EmbedBuilder()
          .setColor(0xf39c12)
          .setTitle("📊 Mon Portfolio Crypto")
          .setDescription(lines.join("\n"))
          .setTimestamp(),
      ] });
      return;
    }

    await message.reply("❌ Usage : `&crypto` | `&crypto buy <coin> <montant>` | `&crypto sell <coin> <qté|all>` | `&crypto portfolio`");
  },
};
