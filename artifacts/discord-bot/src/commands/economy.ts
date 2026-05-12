import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import {
  getUser, saveUser, getLeaderboard, fmt, cooldownLeft, rand, isBooster,
  DAILY_CD, WORK_CD, REP_CD, REP_CD_BOOSTER, METIER_PRIX,
  applyLivretInterets,
} from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";
import { getLeaderboardTeams } from "../utils/teamStore.js";
import { BOT_OWNER_ID } from "./owner.js";

const WORK_OUTCOMES = [
  "Tu as livré des colis",
  "Tu as vendu des trucs sur Vinted",
  "Tu as posé du carrelage",
  "Tu as fait du baby-sitting",
  "Tu as réparé une bagnole",
  "T'as fait de la manutention",
  "T'as vendu des kebabs",
  "T'as fait des courses pour un vieux",
  "T'as bossé en caisse",
  "T'as peint un appartement",
];

// ─── &solde ───────────────────────────────────────────────────────────────────

export const soldeCommand: Command = {
  name: "solde",
  description: "Voir ton solde",
  usage: "&solde [@membre]",
  execute: async (message) => {
    const target = message.mentions.users.first() ?? message.author;
    const guildId = message.guild!.id;
    const cfg = getEcoConfig(guildId);
    let u = getUser(guildId, target.id);
    u = applyLivretInterets(u);
    saveUser(guildId, target.id, u);
    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle(`💰 Solde — ${target.username}`)
      .addFields(
        { name: "👜 Poche",   value: fmt(u.poche, cfg.monnaie),  inline: true },
        { name: "🏦 Banque",  value: fmt(u.banque, cfg.monnaie), inline: true },
        { name: "🏧 Livret",  value: fmt(u.livret, cfg.monnaie), inline: true },
        { name: "📊 Total",   value: fmt(u.poche + u.banque + u.livret, cfg.monnaie), inline: true },
        { name: "💼 Métier",  value: u.metier === "aucun" ? "*aucun*" : u.metier, inline: true },
        { name: "⭐ Réputation", value: `**${u.rep}** rep`, inline: true },
      )
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};

// ─── &daily ───────────────────────────────────────────────────────────────────

export const dailyCommand: Command = {
  name: "daily",
  description: "Réclame tes coins quotidiens",
  usage: "&daily",
  execute: async (message) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    const wait    = cooldownLeft(u.lastDaily, DAILY_CD);
    if (wait) { await message.reply(`⏱ Reviens dans **${wait}**.`); return; }
    const booster = message.member ? isBooster(message.member) : false;
    let gain = rand(cfg.dailyMin, cfg.dailyMax);
    if (booster) gain = Math.floor(gain * 1.1);
    if (u.buffs.boostDaily) { gain *= 2; u.buffs.boostDaily = false; }
    u.poche += gain;
    u.totalEarned += gain;
    u.lastDaily = Date.now();
    saveUser(guildId, userId, u);
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("✅ Daily réclamé !")
      .setDescription(`Tu reçois ${fmt(gain, cfg.monnaie)}${booster ? " *(+10% booster)*" : ""}\nPoche : ${fmt(u.poche, cfg.monnaie)}`)
      .setTimestamp();
    await message.reply({ embeds: [embed] });
  },
};

// ─── &work ────────────────────────────────────────────────────────────────────

export const workCommand: Command = {
  name: "work",
  description: "Travailler (cooldown 20 min)",
  usage: "&work",
  execute: async (message) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    const wait    = cooldownLeft(u.lastWork, WORK_CD);
    if (wait) { await message.reply(`⏱ Repos obligatoire — reviens dans **${wait}**.`); return; }
    const booster = message.member ? isBooster(message.member) : false;
    let gain = rand(cfg.workMin, cfg.workMax);
    if (booster) gain = Math.floor(gain * 1.1);
    let boostUsed = false;
    if ((u.buffs.boostWork ?? 0) > 0) {
      gain *= 2;
      u.buffs.boostWork = (u.buffs.boostWork ?? 1) - 1;
      boostUsed = true;
    }
    const outcome = WORK_OUTCOMES[Math.floor(Math.random() * WORK_OUTCOMES.length)]!;
    u.poche += gain;
    u.totalEarned += gain;
    u.lastWork = Date.now();
    saveUser(guildId, userId, u);
    await message.reply(`💼 ${outcome}. Tu gagnes ${fmt(gain, cfg.monnaie)}${boostUsed ? " *(boost x2)*" : ""}${booster ? " *(+10% booster)*" : ""} !`);
  },
};

// ─── &pay ─────────────────────────────────────────────────────────────────────

export const payCommand: Command = {
  name: "pay",
  description: "Transférer des coins",
  usage: "&pay @membre <montant>",
  execute: async (message, args) => {
    const target = message.mentions.users.first();
    const amount = parseInt(args.find(a => /^\d+$/.test(a)) ?? "");
    if (!target || isNaN(amount) || amount <= 0) {
      await message.reply("❌ Usage : `&pay @membre <montant>`"); return;
    }
    if (target.id === message.author.id) { await message.reply("❌ Tu peux pas te payer toi-même."); return; }
    const guildId = message.guild!.id;
    const cfg     = getEcoConfig(guildId);
    const sender  = getUser(guildId, message.author.id);
    if (sender.poche < amount) {
      await message.reply(`❌ Poche insuffisante. T'as ${fmt(sender.poche, cfg.monnaie)} en poche.`); return;
    }
    sender.poche -= amount;
    saveUser(guildId, message.author.id, sender);
    const recv = getUser(guildId, target.id);
    recv.poche += amount;
    saveUser(guildId, target.id, recv);
    await message.reply(`✅ ${fmt(amount, cfg.monnaie)} envoyés à ${target}.`);
  },
};

// ─── &dep / &deposit ──────────────────────────────────────────────────────────

export const depCommand: Command = {
  name: "dep",
  description: "Déposer en banque",
  usage: "&dep <montant|all>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    const raw     = args[0]?.toLowerCase();
    const amount  = raw === "all" ? u.poche : parseInt(raw ?? "");
    if (isNaN(amount) || amount <= 0) { await message.reply("❌ Usage : `&dep <montant|all>`"); return; }
    if (u.poche < amount) { await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return; }
    u.poche -= amount;
    u.banque += amount;
    saveUser(guildId, userId, u);
    await message.reply(`🏦 ${fmt(amount, cfg.monnaie)} déposés en banque. Banque : ${fmt(u.banque, cfg.monnaie)}`);
  },
};

export const depositCommand: Command = { ...depCommand, name: "deposit" };

// ─── &with / &withdraw ────────────────────────────────────────────────────────

export const withCommand: Command = {
  name: "with",
  description: "Retirer de la banque",
  usage: "&with <montant|all>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    const raw     = args[0]?.toLowerCase();
    const amount  = raw === "all" ? u.banque : parseInt(raw ?? "");
    if (isNaN(amount) || amount <= 0) { await message.reply("❌ Usage : `&with <montant|all>`"); return; }
    if (u.banque < amount) { await message.reply(`❌ Banque insuffisante (${fmt(u.banque, cfg.monnaie)}).`); return; }
    u.banque -= amount;
    u.poche  += amount;
    saveUser(guildId, userId, u);
    await message.reply(`👜 ${fmt(amount, cfg.monnaie)} retirés. Poche : ${fmt(u.poche, cfg.monnaie)}`);
  },
};

export const withdrawCommand: Command = { ...withCommand, name: "withdraw" };

// ─── &rep ─────────────────────────────────────────────────────────────────────

export const repCommand: Command = {
  name: "rep",
  description: "Donner de la réputation à un membre",
  usage: "&rep @membre",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const target  = message.mentions.users.first();
    if (!target) {
      const u = getUser(guildId, userId);
      await message.reply(`⭐ Ta réputation : **${u.rep}** rep`); return;
    }
    if (target.id === userId) { await message.reply("❌ Tu peux pas te rep toi-même."); return; }
    const giver  = getUser(guildId, userId);
    const booster = message.member ? isBooster(message.member) : false;
    const cd     = booster ? REP_CD_BOOSTER : REP_CD;
    const last   = giver.lastRepGiven[target.id] ?? 0;
    const wait   = cooldownLeft(last, cd);
    if (wait) { await message.reply(`⏱ Tu peux re-rep ${target} dans **${wait}**.`); return; }
    giver.lastRepGiven[target.id] = Date.now();
    saveUser(guildId, userId, giver);
    const recv = getUser(guildId, target.id);
    recv.rep += 2;
    saveUser(guildId, target.id, recv);
    await message.reply(`⭐ +2 réputation donnés à ${target} ! Ils ont maintenant **${recv.rep}** rep.`);
  },
};

// ─── &metier ─────────────────────────────────────────────────────────────────

export const metierCommand: Command = {
  name: "metier",
  description: "Choisir un métier avec sa réputation",
  usage: "&metier <braqueur|cambrioleur|cybervoleur|juge>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const choix   = args[0]?.toLowerCase() as import("../utils/economy.ts").Metier | undefined;
    const valides = ["braqueur", "cambrioleur", "cybervoleur", "juge"] as const;
    if (!choix || !valides.includes(choix as any)) {
      const lines = valides.map(m => `• **${m}** — ${METIER_PRIX[m]} rep`).join("\n");
      await message.reply(`💼 Métiers disponibles :\n${lines}\n\nUsage : \`&metier <nom>\``); return;
    }
    const u    = getUser(guildId, userId);
    const prix = METIER_PRIX[choix];
    if (u.rep < prix) {
      await message.reply(`❌ Il te faut **${prix} rep** pour devenir ${choix}. T'en as **${u.rep}**.`); return;
    }
    if (u.metier === choix) { await message.reply(`Tu es déjà **${choix}**.`); return; }
    u.metier = choix;
    saveUser(guildId, userId, u);
    await message.reply(`✅ Tu es maintenant **${choix}** !`);
  },
};

// ─── &top ─────────────────────────────────────────────────────────────────────

export const topCommand: Command = {
  name: "top",
  description: "Classements du serveur",
  usage: "&top [poche|team|rep]",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const cfg     = getEcoConfig(guildId);
    const sub     = args[0]?.toLowerCase();
    const medals  = ["🥇", "🥈", "🥉"];

    if (sub === "team") {
      const board = getLeaderboardTeams(guildId);
      if (!board.length) { await message.reply("Aucune équipe sur ce serveur."); return; }
      const lines = board.map((t, i) => `${medals[i] ?? `**${i + 1}.**`} **${t.name}** — ${fmt(t.coffre, cfg.monnaie)}`);
      await message.reply({ embeds: [new EmbedBuilder().setColor(0x9b59b6).setTitle("🏆 Top Équipes — Coffre").setDescription(lines.join("\n")).setTimestamp()] });
      return;
    }

    const mode = sub === "poche" ? "poche" : sub === "rep" ? "rep" : "total";
    const board = getLeaderboard(guildId, mode);
    if (!board.length) { await message.reply("Aucun membre avec des coins pour l'instant."); return; }
    const title = mode === "poche" ? "🏆 Top Poche" : mode === "rep" ? "🏆 Top Réputation" : "🏆 Top Global";
    const lines = board.map((e, i) => {
      const val = mode === "rep" ? `**${e.value}** rep` : fmt(e.value, cfg.monnaie);
      return `${medals[i] ?? `**${i + 1}.**`} <@${e.userId}> — ${val}`;
    });
    await message.reply({ embeds: [new EmbedBuilder().setColor(0xf1c40f).setTitle(title).setDescription(lines.join("\n")).setTimestamp()] });
  },
};

// ─── &help éco ────────────────────────────────────────────────────────────────

export const ecoHelpCommand: Command = {
  name: "help",
  description: "Aide — système économique",
  usage: "&help",
  execute: async (message) => {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("📖 Commandes économiques — préfixe `&`")
      .addFields(
        { name: "💰 Argent", value: "`&solde` `&daily` `&work` `&pay @m <montant>` `&dep <montant|all>` `&with <montant|all>`" },
        { name: "⭐ Réputation", value: "`&rep @membre` — +2 rep (cd 5h)\n`&rep` — voir ta rep\n`&metier <nom>` — acheter un métier avec ta rep" },
        { name: "💼 Métiers & actions", value: "`&braquer @m` ou `&braquer team <nom>` *(braqueur)*\n`&cambrioler @m` *(cambrioleur)*\n`&casser <team>` *(cybervoleur)*\n`&juger @m` *(juge)*" },
        { name: "👥 Équipes", value: "`&team create <nom>` `&team invite @m` `&team kick @m`\n`&team info` `&team coffre dep/with <montant|all>` `&team troupes` `&team upgrade`" },
        { name: "🏦 Livret", value: "`&livret` `&livret dep <montant|all>` `&livret with <montant|all>`\n*Intérêts : 2%/24h automatiques*" },
        { name: "🏗️ Tycoon", value: "`&tycoon` `&tycoon upgrade` `&tycoon collect`" },
        { name: "📈 Crypto", value: "`&crypto` `&crypto buy <coin> <montant>` `&crypto sell <coin> <qté>` `&crypto portfolio`" },
        { name: "🎰 Casino", value: "`&roulette <montant> <rouge|noir|pair|impair|0-36>`\n`&blackjack <montant>`" },
        { name: "🛒 Shop", value: "`&shop` `&shop buy <article>`" },
        { name: "🏆 Classements", value: "`&top` `&top poche` `&top team` `&top rep`" },
      )
      .setFooter({ text: "Commandes admin : &ecoconfig | Setup : &coinsetup" });
    await message.reply({ embeds: [embed] });
  },
};
