import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";
import { getUserTeam, saveTeam } from "../utils/teamStore.js";

const ARTICLES = [
  { id: "antirob",      nom: "Antirob",               desc: "Protège ta poche 1h contre tout vol/braquage",      prix: 1_500  },
  { id: "blindage",     nom: "Blindage",               desc: "Protège ta poche 5h contre tout vol/braquage",      prix: 5_000  },
  { id: "boost-daily",  nom: "Boost Daily x2",         desc: "Double ton prochain daily",                         prix: 5_000  },
  { id: "boost-work",   nom: "Boost Work x2 (x3)",     desc: "Double tes 3 prochains work",                       prix: 3_000  },
  { id: "cadenas-supp", nom: "Cadenas supplémentaire", desc: "Ajoute un 6e cadenas à ton coffre d'équipe",        prix: 20_000 },
];

export const shopCommand: Command = {
  name: "shop",
  description: "Boutique — achète des items avec tes coins",
  usage: "&shop [buy <article>]",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const sub     = args[0]?.toLowerCase();

    // ── catalogue ─────────────────────────────────────────────────────────────
    if (!sub || sub !== "buy") {
      const lines = ARTICLES.map(a => `**${a.nom}** (\`${a.id}\`) — ${fmt(a.prix, cfg.monnaie)}\n> ${a.desc}`);
      await message.reply({ embeds: [
        new EmbedBuilder()
          .setColor(0xe91e63)
          .setTitle("🛒 Boutique")
          .setDescription(lines.join("\n\n"))
          .setFooter({ text: "Acheter : &shop buy <id>" }),
      ] });
      return;
    }

    // ── achat ─────────────────────────────────────────────────────────────────
    const articleId = args[1]?.toLowerCase();
    const article   = ARTICLES.find(a => a.id === articleId);
    if (!article) {
      await message.reply(`❌ Article inconnu. IDs disponibles : ${ARTICLES.map(a => `\`${a.id}\``).join(", ")}`); return;
    }
    const u = getUser(guildId, userId);
    if (u.poche < article.prix) {
      await message.reply(`❌ Poche insuffisante. Il faut ${fmt(article.prix, cfg.monnaie)} (tu as ${fmt(u.poche, cfg.monnaie)}).`); return;
    }
    u.poche -= article.prix;

    const now = Date.now();
    switch (article.id) {
      case "antirob":
        u.buffs.antirob = now + 3_600_000; // 1h
        break;
      case "blindage":
        u.buffs.blindage = now + 5 * 3_600_000; // 5h
        break;
      case "boost-daily":
        u.buffs.boostDaily = true;
        break;
      case "boost-work":
        u.buffs.boostWork = (u.buffs.boostWork ?? 0) + 3;
        break;
      case "cadenas-supp": {
        const team = getUserTeam(guildId, userId);
        if (!team) {
          u.poche += article.prix; // rembourser
          saveUser(guildId, userId, u);
          await message.reply("❌ Tu dois être dans une équipe pour acheter un cadenas supplémentaire."); return;
        }
        team.extraCadenas = (team.extraCadenas ?? 0) + 1;
        team.cadenas.push(true);
        saveTeam(guildId, team);
        saveUser(guildId, userId, u);
        await message.reply(`✅ Cadenas supplémentaire ajouté au coffre de **${team.name}** ! (${team.cadenas.length} cadenas total)`);
        return;
      }
    }

    saveUser(guildId, userId, u);
    await message.reply(`✅ **${article.nom}** activé ! ${article.desc}.`);
  },
};
