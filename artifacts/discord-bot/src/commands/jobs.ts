import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt, cooldownLeft, rand, JOB_CD } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";
import { getTeam, getUserTeam, saveTeam, repairCadenas, tauxCassage } from "../utils/teamStore.js";
import { BOT_OWNER_ID } from "./owner.js";

// ─── &braquer ─────────────────────────────────────────────────────────────────

export const braquerCommand: Command = {
  name: "braquer",
  description: "Braquer un joueur ou une team (braqueur uniquement)",
  usage: "&braquer @membre  ou  &braquer team <nom>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    if (u.metier !== "braqueur") { await message.reply("❌ Ce métier est réservé aux **braqueurs**."); return; }
    const wait = cooldownLeft(u.lastJob, JOB_CD);
    if (wait) { await message.reply(`⏱ Prochaine action dans **${wait}**.`); return; }

    // ── Braquage TEAM ────────────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === "team") {
      const teamName = args.slice(1).join(" ");
      if (!teamName) { await message.reply("❌ Donne un nom d'équipe : `&braquer team <nom>`"); return; }
      let team = getTeam(guildId, teamName);
      if (!team) { await message.reply("❌ Équipe introuvable."); return; }
      team = repairCadenas(team);
      const cassés = team.cadenas.filter(c => !c).length;
      const total  = team.cadenas.length;
      if (cassés < total) {
        await message.reply(`🔒 Il reste **${total - cassés}/${total} cadenas** intacts. Le cybervoleur doit tous les casser d'abord.`);
        saveTeam(guildId, team);
        return;
      }
      if (team.coffre <= 0) { await message.reply("❌ Le coffre de l'équipe est vide."); return; }
      // 40% réussite
      u.lastJob = Date.now();
      if (Math.random() < 0.40) {
        const pct  = rand(15, 35);
        const gain = Math.floor(team.coffre * pct / 100);
        u.poche += gain;
        u.totalEarned += gain;
        team.coffre -= gain;
        team.cadenas = Array(team.cadenas.length).fill(true); // cadenas réparés
        team.lastRepair = Date.now();
        saveUser(guildId, userId, u);
        saveTeam(guildId, team);
        await message.reply(`💰 Braquage réussi ! Tu voles **${pct}%** du coffre → ${fmt(gain, cfg.monnaie)} ! Les cadenas se réparent.`);
      } else {
        const pénalité = Math.floor(u.poche * 0.1);
        u.poche = Math.max(0, u.poche - pénalité);
        saveUser(guildId, userId, u);
        await message.reply(`❌ Braquage raté. Tu perds ${fmt(pénalité, cfg.monnaie)} en fuyant.`);
      }
      return;
    }

    // ── Braquage JOUEUR ──────────────────────────────────────────────────────
    const target = message.mentions.users.first();
    if (!target) { await message.reply("❌ Usage : `&braquer @membre` ou `&braquer team <nom>`"); return; }
    if (target.id === userId) { await message.reply("❌ T'as pas besoin de te braquer toi-même."); return; }
    const victim = getUser(guildId, target.id);
    if (victim.poche <= 0) { await message.reply(`❌ ${target} n'a rien en poche.`); return; }
    const now = Date.now();
    const protégé = (victim.buffs.antirob && victim.buffs.antirob > now) || (victim.buffs.blindage && victim.buffs.blindage > now);
    if (protégé) { await message.reply(`🛡️ ${target} est protégé(e) — impossible de le braquer maintenant.`); return; }
    u.lastJob = Date.now();
    if (Math.random() < 0.50) {
      const pct  = rand(10, 30);
      const gain = Math.floor(victim.poche * pct / 100);
      u.poche += gain;
      u.totalEarned += gain;
      victim.poche -= gain;
      saveUser(guildId, userId, u);
      saveUser(guildId, target.id, victim);
      await message.reply(`💰 Braquage réussi sur ${target} ! Tu voles **${pct}%** de sa poche → ${fmt(gain, cfg.monnaie)}.`);
    } else {
      const pénalité = Math.floor(u.poche * 0.08);
      u.poche = Math.max(0, u.poche - pénalité);
      saveUser(guildId, userId, u);
      await message.reply(`❌ Braquage raté. Tu perds ${fmt(pénalité, cfg.monnaie)} en fuyant.`);
    }
  },
};

// ─── &cambrioler ─────────────────────────────────────────────────────────────

export const cambriolerCommand: Command = {
  name: "cambrioler",
  description: "Voler le livret d'un autre cambrioleur",
  usage: "&cambrioler @membre",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);
    if (u.metier !== "cambrioleur") { await message.reply("❌ Ce métier est réservé aux **cambrioleurs**."); return; }
    const wait = cooldownLeft(u.lastJob, JOB_CD);
    if (wait) { await message.reply(`⏱ Prochaine action dans **${wait}**.`); return; }
    const target = message.mentions.users.first();
    if (!target) { await message.reply("❌ Usage : `&cambrioler @membre`"); return; }
    if (target.id === userId) { await message.reply("❌ Tu peux pas te cambrioler toi-même."); return; }
    const victim = getUser(guildId, target.id);
    if (victim.metier !== "cambrioleur") { await message.reply(`❌ ${target} n'est pas cambrioleur. Tu ne peux cibler que des cambrioleurs.`); return; }
    if (victim.livret <= 0) { await message.reply(`❌ ${target} n'a rien dans son livret.`); return; }
    const now = Date.now();
    const protégé = (victim.buffs.antirob && victim.buffs.antirob > now) || (victim.buffs.blindage && victim.buffs.blindage > now);
    if (protégé) { await message.reply(`🛡️ ${target} est protégé(e).`); return; }
    u.lastJob = Date.now();
    if (Math.random() < 0.60) {
      const pct  = rand(5, 20);
      const gain = Math.floor(victim.livret * pct / 100);
      u.poche += gain;
      u.totalEarned += gain;
      victim.livret -= gain;
      saveUser(guildId, userId, u);
      saveUser(guildId, target.id, victim);
      await message.reply(`🏠 Cambriolage réussi ! Tu voles **${pct}%** du livret de ${target} → ${fmt(gain, cfg.monnaie)}.`);
    } else {
      const pénalité = rand(200, 600);
      u.poche = Math.max(0, u.poche - pénalité);
      saveUser(guildId, userId, u);
      await message.reply(`❌ Cambriolage raté — tu te fais surprendre et perds ${fmt(pénalité, cfg.monnaie)}.`);
    }
  },
};

// ─── &casser ─────────────────────────────────────────────────────────────────

export const casserCommand: Command = {
  name: "casser",
  description: "Casser un cadenas d'un coffre de team (cybervoleur)",
  usage: "&casser <nom_team>",
  execute: async (message, args) => {
    const guildId  = message.guild!.id;
    const userId   = message.author.id;
    const cfg      = getEcoConfig(guildId);
    const u        = getUser(guildId, userId);
    if (u.metier !== "cybervoleur") { await message.reply("❌ Ce métier est réservé aux **cybervoleurs**."); return; }
    const wait = cooldownLeft(u.lastJob, JOB_CD);
    if (wait) { await message.reply(`⏱ Prochaine tentative dans **${wait}**.`); return; }
    const teamName = args.join(" ");
    if (!teamName) { await message.reply("❌ Usage : `&casser <nom_team>`"); return; }
    let team = getTeam(guildId, teamName);
    if (!team) { await message.reply("❌ Équipe introuvable."); return; }
    team = repairCadenas(team);
    const intacts = team.cadenas.filter(c => c).length;
    if (intacts === 0) {
      await message.reply(`✅ Tous les cadenas de **${team.name}** sont déjà cassés ! Un braqueur peut piller.`);
      saveTeam(guildId, team);
      return;
    }
    const taux = tauxCassage(team.troupeLevel);
    u.lastJob = Date.now();
    saveUser(guildId, userId, u);
    if (Math.random() * 100 < taux) {
      const idx = team.cadenas.findIndex(c => c);
      team.cadenas[idx] = false;
      const restants = team.cadenas.filter(c => c).length;
      saveTeam(guildId, team);
      await message.reply(
        restants === 0
          ? `🔓 Dernier cadenas cassé ! Le coffre de **${team.name}** est ouvert — un braqueur peut piller.`
          : `🔓 Cadenas cassé ! Il reste **${restants}** cadenas sur le coffre de **${team.name}**.`
      );
    } else {
      saveTeam(guildId, team);
      await message.reply(`❌ Échec — le cadenas de **${team.name}** a résisté (troupes niveau ${team.troupeLevel}).`);
    }
  },
};

// ─── &juger ──────────────────────────────────────────────────────────────────

const JUGER_CD   = 6 * 3600_000;
const jugerLast  = new Map<string, Map<string, number>>();

export const jugerCommand: Command = {
  name: "juger",
  description: "Retirer le métier d'un membre (juge uniquement)",
  usage: "&juger @membre",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const u       = getUser(guildId, userId);
    if (u.metier !== "juge") { await message.reply("❌ Ce métier est réservé aux **juges**."); return; }
    const wait = cooldownLeft(u.lastJob, JOB_CD);
    if (wait) { await message.reply(`⏱ Prochaine action dans **${wait}**.`); return; }
    const target = message.mentions.users.first();
    if (!target) { await message.reply("❌ Usage : `&juger @membre`"); return; }
    if (target.id === userId) { await message.reply("❌ Tu peux pas te juger toi-même."); return; }
    if (!jugerLast.has(guildId)) jugerLast.set(guildId, new Map());
    const gMap = jugerLast.get(guildId)!;
    const key  = `${userId}:${target.id}`;
    const lastT = gMap.get(key) ?? 0;
    const waitJ = cooldownLeft(lastT, JUGER_CD);
    if (waitJ) { await message.reply(`⏱ Tu as déjà jugé ${target} récemment. Réessaie dans **${waitJ}**.`); return; }
    const victim = getUser(guildId, target.id);
    if (victim.metier === "aucun") { await message.reply(`❌ ${target} n'a pas de métier.`); return; }
    const ancienMetier = victim.metier;
    victim.metier = "aucun";
    saveUser(guildId, target.id, victim);
    u.lastJob = Date.now();
    saveUser(guildId, userId, u);
    gMap.set(key, Date.now());
    await message.reply(`⚖️ Verdict rendu ! ${target} perd son métier de **${ancienMetier}**.`);
  },
};
