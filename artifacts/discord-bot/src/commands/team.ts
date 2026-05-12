import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";
import {
  getTeam, getUserTeam, saveTeam, createTeam, deleteTeam,
  repairCadenas, TROUPE_LEVELS, getGuildTeams,
} from "../utils/teamStore.js";

export const teamCommand: Command = {
  name: "team",
  description: "Gestion des équipes",
  usage: "&team <create|invite|kick|info|coffre|troupes|upgrade|leave|disband>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const sub     = args[0]?.toLowerCase();

    // ── create ────────────────────────────────────────────────────────────────
    if (sub === "create") {
      const nom = args.slice(1).join(" ").toLowerCase().trim();
      if (!nom || nom.length > 20) { await message.reply("❌ Donne un nom (1-20 caractères) : `&team create <nom>`"); return; }
      const existing = getUserTeam(guildId, userId);
      if (existing) { await message.reply(`❌ Tu es déjà dans une équipe : **${existing.name}**.`); return; }
      if (getTeam(guildId, nom)) { await message.reply("❌ Ce nom est déjà pris."); return; }
      createTeam(guildId, nom, userId);
      await message.reply(`✅ Équipe **${nom}** créée ! Tu en es le chef.`);
      return;
    }

    // ── invite ────────────────────────────────────────────────────────────────
    if (sub === "invite") {
      const target = message.mentions.users.first();
      if (!target) { await message.reply("❌ Usage : `&team invite @membre`"); return; }
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      if (myTeam.ownerId !== userId) { await message.reply("❌ Seul le chef peut inviter."); return; }
      if (getUserTeam(guildId, target.id)) { await message.reply(`❌ ${target} est déjà dans une équipe.`); return; }
      if (myTeam.members.includes(target.id)) { await message.reply("❌ Ce membre est déjà dans ton équipe."); return; }
      myTeam.members.push(target.id);
      saveTeam(guildId, myTeam);
      await message.reply(`✅ ${target} ajouté(e) à l'équipe **${myTeam.name}** !`);
      return;
    }

    // ── kick ──────────────────────────────────────────────────────────────────
    if (sub === "kick") {
      const target = message.mentions.users.first();
      if (!target) { await message.reply("❌ Usage : `&team kick @membre`"); return; }
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      if (myTeam.ownerId !== userId) { await message.reply("❌ Seul le chef peut exclure."); return; }
      if (target.id === userId) { await message.reply("❌ Tu peux pas te kick toi-même. Utilise `&team disband`."); return; }
      if (!myTeam.members.includes(target.id)) { await message.reply("❌ Ce membre n'est pas dans ton équipe."); return; }
      myTeam.members = myTeam.members.filter(id => id !== target.id);
      saveTeam(guildId, myTeam);
      await message.reply(`✅ ${target} exclu(e) de l'équipe **${myTeam.name}**.`);
      return;
    }

    // ── leave ─────────────────────────────────────────────────────────────────
    if (sub === "leave") {
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'es dans aucune équipe."); return; }
      if (myTeam.ownerId === userId) { await message.reply("❌ Tu es le chef — utilise `&team disband` pour dissoudre l'équipe."); return; }
      myTeam.members = myTeam.members.filter(id => id !== userId);
      saveTeam(guildId, myTeam);
      await message.reply(`✅ Tu as quitté l'équipe **${myTeam.name}**.`);
      return;
    }

    // ── disband ───────────────────────────────────────────────────────────────
    if (sub === "disband") {
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      if (myTeam.ownerId !== userId) { await message.reply("❌ Seul le chef peut dissoudre l'équipe."); return; }
      deleteTeam(guildId, myTeam.name);
      await message.reply(`✅ Équipe **${myTeam.name}** dissoute.`);
      return;
    }

    // ── coffre ────────────────────────────────────────────────────────────────
    if (sub === "coffre") {
      const action = args[1]?.toLowerCase();
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      if (action === "dep" || action === "deposit") {
        const u    = getUser(guildId, userId);
        const raw  = args[2]?.toLowerCase();
        const amt  = raw === "all" ? u.poche : parseInt(raw ?? "");
        if (isNaN(amt) || amt <= 0) { await message.reply("❌ Usage : `&team coffre dep <montant|all>`"); return; }
        if (u.poche < amt) { await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return; }
        u.poche -= amt;
        myTeam.coffre += amt;
        saveUser(guildId, userId, u);
        saveTeam(guildId, myTeam);
        await message.reply(`🏦 ${fmt(amt, cfg.monnaie)} déposés dans le coffre de **${myTeam.name}**. Coffre : ${fmt(myTeam.coffre, cfg.monnaie)}`);
        return;
      }
      if (action === "with" || action === "withdraw") {
        if (myTeam.ownerId !== userId) { await message.reply("❌ Seul le chef peut retirer du coffre."); return; }
        const u   = getUser(guildId, userId);
        const raw = args[2]?.toLowerCase();
        const amt = raw === "all" ? myTeam.coffre : parseInt(raw ?? "");
        if (isNaN(amt) || amt <= 0) { await message.reply("❌ Usage : `&team coffre with <montant|all>`"); return; }
        if (myTeam.coffre < amt) { await message.reply(`❌ Coffre insuffisant (${fmt(myTeam.coffre, cfg.monnaie)}).`); return; }
        myTeam.coffre -= amt;
        u.poche += amt;
        saveUser(guildId, userId, u);
        saveTeam(guildId, myTeam);
        await message.reply(`👜 ${fmt(amt, cfg.monnaie)} retirés du coffre. Poche : ${fmt(u.poche, cfg.monnaie)}`);
        return;
      }
      await message.reply("❌ Usage : `&team coffre dep <montant|all>` ou `&team coffre with <montant|all>`");
      return;
    }

    // ── troupes ───────────────────────────────────────────────────────────────
    if (sub === "troupes") {
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      const lvl  = myTeam.troupeLevel;
      const info = TROUPE_LEVELS[lvl]!;
      const next = TROUPE_LEVELS[lvl + 1];
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`🪖 Troupes — ${myTeam.name}`)
        .addFields(
          { name: "Niveau actuel", value: `**${lvl}** — ${info.name}`, inline: true },
          { name: "Bonus cadenas", value: `-${info.cadenasBonus}% réussite cybervoleur`, inline: true },
          { name: "Prochain niveau", value: next ? `${next.name} — ${fmt(next.cost!, cfg.monnaie)}` : "Niveau max atteint", inline: false },
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    // ── upgrade troupes ───────────────────────────────────────────────────────
    if (sub === "upgrade") {
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) { await message.reply("❌ Tu n'as pas d'équipe."); return; }
      if (myTeam.ownerId !== userId) { await message.reply("❌ Seul le chef peut upgrader les troupes."); return; }
      const next = TROUPE_LEVELS[myTeam.troupeLevel + 1];
      if (!next) { await message.reply("✅ Tes troupes sont déjà au niveau maximum."); return; }
      if (myTeam.coffre < next.cost!) {
        await message.reply(`❌ Coffre insuffisant. Il faut ${fmt(next.cost!, cfg.monnaie)} (coffre : ${fmt(myTeam.coffre, cfg.monnaie)}).`);
        return;
      }
      myTeam.coffre -= next.cost!;
      myTeam.troupeLevel++;
      saveTeam(guildId, myTeam);
      await message.reply(`✅ Troupes upgradées → **${next.name}** (niveau ${myTeam.troupeLevel}) !`);
      return;
    }

    // ── info ──────────────────────────────────────────────────────────────────
    if (!sub || sub === "info") {
      const myTeam = getUserTeam(guildId, userId);
      if (!myTeam) {
        const all = getGuildTeams(guildId);
        const names = Object.keys(all);
        if (!names.length) { await message.reply("Aucune équipe sur ce serveur."); return; }
        await message.reply(`Équipes : ${names.map(n => `**${n}**`).join(", ")}\nTu n'es dans aucune équipe.`);
        return;
      }
      const t     = repairCadenas(myTeam);
      saveTeam(guildId, t);
      const total   = t.cadenas.length;
      const intacts = t.cadenas.filter(c => c).length;
      const cadStr  = t.cadenas.map(c => c ? "🔒" : "🔓").join(" ");
      const embed   = new EmbedBuilder()
        .setColor(0x9b59b6)
        .setTitle(`👥 Équipe — ${t.name}`)
        .addFields(
          { name: "Chef",      value: `<@${t.ownerId}>`, inline: true },
          { name: "Membres",   value: `${t.members.length}`, inline: true },
          { name: "Coffre",    value: fmt(t.coffre, cfg.monnaie), inline: true },
          { name: "Cadenas",   value: `${cadStr}\n${intacts}/${total} intacts`, inline: false },
          { name: "Troupes",   value: `Niveau ${t.troupeLevel} — ${TROUPE_LEVELS[t.troupeLevel]!.name}`, inline: true },
          { name: "Membres",   value: t.members.map(id => `<@${id}>`).join(", ") || "*aucun*", inline: false },
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    await message.reply("❌ Usage : `&team <create|invite|kick|coffre|troupes|upgrade|info|leave|disband>`");
  },
};
