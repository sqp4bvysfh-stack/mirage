import { EmbedBuilder, userMention } from "discord.js";
import type { Message, User } from "discord.js";
import type { Command } from "../types.js";

const MOT_PAIRS = [
  ["Chat", "Chien"],
  ["Pizza", "Burger"],
  ["Plage", "Piscine"],
  ["Voiture", "Moto"],
  ["Café", "Thé"],
  ["Football", "Rugby"],
  ["Avion", "Train"],
  ["Chocolat", "Bonbon"],
  ["Cinéma", "Théâtre"],
  ["Soleil", "Lune"],
  ["Montagne", "Forêt"],
  ["Paris", "Lyon"],
  ["Roi", "Président"],
  ["Épée", "Arc"],
  ["Dragon", "Licorne"],
  ["Boulangerie", "Pâtisserie"],
  ["Guitare", "Piano"],
  ["Hiver", "Automne"],
  ["Requin", "Dauphin"],
  ["Vampire", "Zombie"],
  ["Instagram", "TikTok"],
  ["Nike", "Adidas"],
  ["McDonald's", "KFC"],
  ["Harry Potter", "Narnia"],
  ["Rap", "RnB"],
  ["Sushi", "Ramen"],
  ["Crêpe", "Gaufre"],
  ["Bière", "Vin"],
  ["Boxe", "Judo"],
  ["Piscine", "Jacuzzi"],
  ["iPhone", "Samsung"],
  ["Netflix", "Disney+"],
  ["Lune", "Étoile"],
  ["Tigre", "Lion"],
  ["Fraise", "Framboise"],
  ["Ski", "Snowboard"],
  ["Dentiste", "Médecin"],
  ["Prison", "Commissariat"],
  ["Mariage", "Fiançailles"],
  ["Fantôme", "Sorcière"],
  ["Printemps", "Été"],
  ["Fête", "Anniversaire"],
  ["Collier", "Bracelet"],
  ["Tacos", "Kebab"],
  ["Araignée", "Scorpion"],
  ["Ballon", "Cerf-volant"],
  ["Tableau", "Dessin"],
  ["Commissaire", "Détective"],
  ["Île", "Désert"],
  ["Fusée", "Satellite"],
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

function makeLobbyEmbed(host: User, players: Map<string, User>) {
  const liste = players.size > 0
    ? [...players.values()].map(u => `• ${userMention(u.id)}`).join("\n")
    : "*Personne pour l'instant…*";

  return new EmbedBuilder()
    .setColor(0x2c2f33)
    .setTitle("🕵️ Lobby Undercover")
    .setDescription(
      `**${host.username}** ouvre une partie !\n\n` +
      `Clique sur ✅ pour rejoindre.\nQuand tout le monde est là, ${userMention(host.id)} clique sur 🚀 pour lancer.\n\n` +
      `> Min. **3 joueurs** — Max. **30 joueurs**`
    )
    .addFields({ name: `👥 Joueurs (${players.size})`, value: liste })
    .setFooter({ text: "✅ rejoindre • 🚀 lancer (host uniquement)" })
    .setTimestamp();
}

export const undercoverCommand: Command = {
  name: "undercover",
  description: "Ouvre un lobby Undercover. Les joueurs rejoignent en cliquant sur ✅.",
  usage: "*undercover",

  async execute(message) {
    if (lobbiesActifs.has(message.channelId)) {
      await message.reply("❌ Un lobby est déjà en cours dans ce salon !");
      return;
    }

    lobbiesActifs.add(message.channelId);
    const host = message.author;
    const players = new Map<string, User>();

    const lobbyMsg = await message.channel.send({
      embeds: [makeLobbyEmbed(host, players)],
    });

    await lobbyMsg.react("✅");
    await lobbyMsg.react("🚀");

    const collector = lobbyMsg.createReactionCollector({
      filter: (reaction, user) => !user.bot && ["✅", "🚀"].includes(reaction.emoji.name ?? ""),
      dispose: true,
    });

    const lancer = async () => {
      collector.stop("launched");
      lobbiesActifs.delete(message.channelId);

      if (players.size < 3) {
        await message.channel.send("❌ Pas assez de joueurs pour lancer (minimum 3).");
        await lobbyMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x555555)
              .setTitle("🕵️ Lobby annulé")
              .setDescription("Pas assez de joueurs. Refais `*undercover` pour réessayer.")
              .setTimestamp(),
          ],
        }).catch(() => {});
        return;
      }

      if (players.size > 30) {
        await message.channel.send("❌ Trop de joueurs (maximum 30).");
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

    collector.on("collect", async (reaction, user) => {
      if (reaction.emoji.name === "✅") {
        if (players.size >= 30) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        players.set(user.id, user);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players)] }).catch(() => {});
      }
      if (reaction.emoji.name === "🚀") {
        if (user.id !== host.id) {
          await reaction.users.remove(user.id).catch(() => {});
          return;
        }
        await lancer();
      }
    });

    collector.on("remove", async (reaction, user) => {
      if (reaction.emoji.name === "✅" && user.id !== host.id) {
        players.delete(user.id);
        await lobbyMsg.edit({ embeds: [makeLobbyEmbed(host, players)] }).catch(() => {});
      }
    });

    collector.on("end", async (_, reason) => {
      lobbiesActifs.delete(message.channelId);
      if (reason !== "launched") {
        await lobbyMsg.edit({
          embeds: [
            new EmbedBuilder()
              .setColor(0x555555)
              .setTitle("🕵️ Lobby fermé")
              .setDescription("Le lobby a été fermé. Refais `*undercover` pour en ouvrir un nouveau.")
              .setTimestamp(),
          ],
        }).catch(() => {});
      }
    });
  },
};
