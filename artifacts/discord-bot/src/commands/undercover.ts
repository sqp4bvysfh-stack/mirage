import { EmbedBuilder, userMention } from "discord.js";
import type { Message, User } from "discord.js";
import type { Command } from "../types.js";

const MOT_PAIRS = [
  ["Chat", "Chien"], ["Pizza", "Burger"], ["Plage", "Piscine"],
  ["Voiture", "Moto"], ["Café", "Thé"], ["Football", "Rugby"],
  ["Avion", "Train"], ["Chocolat", "Bonbon"], ["Cinéma", "Théâtre"],
  ["Soleil", "Lune"], ["Montagne", "Forêt"], ["Paris", "Lyon"],
  ["Roi", "Président"], ["Épée", "Arc"], ["Dragon", "Licorne"],
  ["Mer", "Lac"], ["Guitare", "Piano"], ["Loup", "Renard"],
  ["Glace", "Neige"], ["Baguette", "Croissant"],
];

async function lancerPartie(message: Message, players: User[]) {
  const pair = MOT_PAIRS[Math.floor(Math.random() * MOT_PAIRS.length)];
  const indices = [...Array(players.length).keys()];
  const undercoverIndex = indices.splice(Math.floor(Math.random() * indices.length), 1)[0];
  const hasMrWhite = players.length >= 4;
  const mrWhiteIndex = hasMrWhite
    ? indices.splice(Math.floor(Math.random() * indices.length), 1)[0]
    : -1;

  const getRoleInfo = (i: number) => {
    if (i === undercoverIndex) return { mot: pair[1], role: "🕵️ **Undercover**", info: "⚠️ Tu es l'**Undercover** ! Ton mot est différent des civils. Ne te fais pas démasquer." };
    if (i === mrWhiteIndex)   return { mot: null,     role: "⬜ **Mr. White**",   info: "🤫 Tu es **Mr. White** ! Tu n'as pas de mot. Écoute les autres et essaie de deviner le mot des civils avant d'être éliminé." };
    return { mot: pair[0], role: "✅ **Civil**", info: "Tu es un **Civil**. Trouve l'Undercover et Mr. White !" };
  };

  const results = await Promise.all(
    players.map(async (user, i) => {
      const { mot, role, info } = getRoleInfo(i);
      try {
        await user.send(
          `🕵️ **Undercover** — Serveur : **${message.guild?.name}**\n\n` +
          (mot ? `Ton mot secret est : **${mot}**\n\n` : `Tu n'as **pas de mot**.\n\n`) +
          `Tu es ${role}\n${info}`
        );
        return `✅ ${userMention(user.id)} — mot envoyé`;
      } catch {
        return `⚠️ ${userMention(user.id)} — MP fermés`;
      }
    })
  );

  const embed = new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🕵️ Partie d'Undercover lancée !")
    .setDescription(
      `**${players.length} joueurs** participent.\n` +
      `Il y a **1 Undercover**${hasMrWhite ? ", **1 Mr. White**" : ""} parmi vous… Trouvez-les !`
    )
    .addFields({ name: "📬 Envois", value: results.join("\n") })
    .setFooter({ text: "Décrivez votre mot sans le dire directement !" })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
}

// Empêche plusieurs lobbies simultanés par salon
const lobbiesActifs = new Set<string>();

function makeLobbyEmbed(host: User, players: Map<string, User>, tempsRestant: string) {
  const liste = players.size > 0
    ? [...players.values()].map(u => `• ${userMention(u.id)}`).join("\n")
    : "*Personne pour l'instant…*";

  return new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🕵️ Lobby Undercover")
    .setDescription(
      `**${host.username}** ouvre une partie !\n\n` +
      `Rejoins en cliquant sur ✅ ci-dessous.\nQuand tout le monde est là, ${userMention(host.id)} clique sur 🚀 pour lancer.\n\n` +
      `> Min. **3 joueurs** — Max. **12 joueurs**`
    )
    .addFields(
      { name: `👥 Joueurs (${players.size})`, value: liste },
    )
    .setFooter({ text: `⏱️ Lobby actif encore ${tempsRestant} • ✅ rejoindre • 🚀 lancer (host uniquement)` })
    .setTimestamp();
}

export const undercoverCommand: Command = {
  name: "undercover",
  description: "Ouvre un lobby Undercover. Les joueurs rejoignent en cliquant sur ✅.",
  usage: "*undercover",

  async execute(message) {
    // Mode immédiat si des mentions sont fournies (rétrocompatibilité)
    const mentions = message.mentions.users.filter(u => !u.bot);
    if (mentions.size >= 3) {
      await lancerPartie(message, [...mentions.values()]);
      return;
    }
    if (mentions.size > 0 && mentions.size < 3) {
      await message.reply("❌ Il faut au moins **3 joueurs** ! Lance `*undercover` sans mentions pour ouvrir un lobby.");
      return;
    }

    if (lobbiesActifs.has(message.channelId)) {
      await message.reply("❌ Un lobby est déjà en cours dans ce salon !");
      return;
    }

    lobbiesActifs.add(message.channelId);
    const DUREE_MS = 5 * 60 * 1000; // 5 minutes
    const host = message.author;

    const players = new Map<string, User>();
    players.set(host.id, host);

    const lobbyMsg = await message.channel.send({
      embeds: [makeLobbyEmbed(host, players, "5 min")],
    });

    await lobbyMsg.react("✅");
    await lobbyMsg.react("🚀");

    const collector = lobbyMsg.createReactionCollector({
      filter: (reaction, user) => !user.bot && ["✅", "🚀"].includes(reaction.emoji.name ?? ""),
      time: DUREE_MS,
      dispose: true,
    });

    const lancer = async () => {
      collector.stop("launched");
      lobbiesActifs.delete(message.channelId);

      if (players.size < 3) {
        await message.channel.send("❌ Pas assez de joueurs pour lancer (minimum 3).");
        await lobbyMsg.edit({
          embeds: [makeLobbyEmbed(host, players, "expiré").setColor(0x555555).setTitle("🕵️ Lobby annulé")],
        });
        return;
      }

      if (players.size > 12) {
        await message.channel.send("❌ Trop de joueurs (maximum 12).");
        return;
      }

      await lobbyMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x2c2f33)
            .setTitle("🕵️ Lancement en cours…")
            .setDescription(`**${players.size} joueurs** vont recevoir leur mot en MP !`)
            .setTimestamp(),
        ],
      });

      await lancerPartie(message, [...players.values()]);
    };

    // Minuterie pour mettre à jour le footer toutes les minutes
    const intervals = [4, 3, 2, 1].map(min =>
      setTimeout(() => {
        if (collector.ended) return;
        lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, `${min} min`)] }).catch(() => {});
      }, (5 - min) * 60 * 1000)
    );

    collector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "✅") {
        if (players.size >= 12) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        players.set(user.id, user);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, "…")] }).catch(() => {});
      }
      if (reaction.emoji.name === "🚀") {
        if (user.id !== host.id) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        intervals.forEach(clearTimeout);
        await lancer();
      }
    });

    collector.on("remove", async (reaction, user) => {
      if (reaction.emoji.name === "✅" && user.id !== host.id) {
        players.delete(user.id);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players, "…")] }).catch(() => {});
      }
    });

    collector.on("end", async (_, reason) => {
      intervals.forEach(clearTimeout);
      lobbiesActifs.delete(message.channelId);
      if (reason === "time") {
        await lobbyMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x555555)
              .setTitle("🕵️ Lobby expiré")
              .setDescription("Le lobby a expiré sans être lancé. Refais `*undercover` pour en ouvrir un nouveau.")
              .setTimestamp(),
          ],
        }).catch(() => {});
      }
    });
  },
};
