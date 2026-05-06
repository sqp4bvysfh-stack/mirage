import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { isModerator } from "../utils/modCheck.js";

const GIVEAWAY_CHANNEL_ID = "1500134760314572810";

function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|j)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  if (match[2] === "s") return val * 1000;
  if (match[2] === "m") return val * 60 * 1000;
  if (match[2] === "h") return val * 60 * 60 * 1000;
  if (match[2] === "j") return val * 24 * 60 * 60 * 1000;
  return null;
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h${m > 0 ? ` ${m}m` : ""}`;
  if (m > 0) return `${m}m${s > 0 ? ` ${s}s` : ""}`;
  return `${s}s`;
}

export const giveawayCommand: Command = {
  name: "giveaway",
  description: "Lancer un giveaway",
  usage: "*giveaway <durée> <prix>",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    if (message.channel.id !== GIVEAWAY_CHANNEL_ID) {
      await message.reply(`❌ Utilise cette commande dans <#${GIVEAWAY_CHANNEL_ID}>.`);
      return;
    }

    const durStr = args[0];
    const duration = durStr ? parseDuration(durStr) : null;
    if (!duration) {
      await message.reply("❌ Durée invalide. Utilise `10m`, `1h`, `1j`.");
      return;
    }

    const prix = args.slice(1).join(" ");
    if (!prix) {
      await message.reply("❌ Indique un prix. Ex: `*giveaway 1h Nitro`");
      return;
    }

    const endTime = Date.now() + duration;

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle("🎉 GIVEAWAY")
      .setDescription(`**Prix :** ${prix}\n\nRéagis avec 🎉 pour participer !`)
      .addFields(
        { name: "⏱️ Durée", value: formatDuration(duration), inline: true },
        { name: "🏁 Fin", value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
        { name: "📋 Conditions", value: "✅ Être en vocal du début à la fin\n✅ Avoir `/mrag` dans son statut" },
      )
      .setFooter({ text: "Organisé par " + message.author.tag })
      .setTimestamp();

    const giveawayMsg = await message.channel.send({ embeds: [embed] });
    await giveawayMsg.react("🎉");
    await message.delete().catch(() => {});

    setTimeout(async () => {
      try {
        const fetchedMsg = await message.channel.messages.fetch(giveawayMsg.id);
        const reaction = fetchedMsg.reactions.cache.get("🎉");
        if (!reaction) {
          await message.channel.send("❌ Personne n'a participé au giveaway.");
          return;
        }

        const users = await reaction.users.fetch();
        const guild = message.guild!;
        const candidates = users.filter(u => !u.bot);
        const valides = [];

        for (const [, user] of candidates) {
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (!member) continue;

          const inVoice = !!member.voice.channel;
          const hasStatus = member.presence?.activities.some(a =>
            a.state?.toLowerCase().includes("/mrag") ||
            a.name?.toLowerCase().includes("/mrag")
          ) ?? false;

          if (inVoice && hasStatus) valides.push(user);
        }

        const endEmbed = new EmbedBuilder()
          .setTitle("🎉 GIVEAWAY TERMINÉ")
          .setDescription(`**Prix :** ${prix}`)
          .setTimestamp();

        if (valides.length === 0) {
          endEmbed.setColor(0xe74c3c);
          endEmbed.addFields({ name: "Résultat", value: "❌ Aucun participant ne remplit les conditions.\nUtilise `*reroll <ID>` pour relancer sans conditions." });
          await fetchedMsg.edit({ embeds: [endEmbed] });
          await message.channel.send({ embeds: [endEmbed] });
          return;
        }

        const gagnant = valides[Math.floor(Math.random() * valides.length)];
        endEmbed.setColor(0x2ecc71);
        endEmbed.addFields({ name: "🏆 Gagnant", value: `<@${gagnant.id}>` });

        await fetchedMsg.edit({ embeds: [endEmbed] });
        await message.channel.send({ embeds: [endEmbed], content: `🎊 Félicitations <@${gagnant.id}> ! Tu as gagné **${prix}** !` });

      } catch (err) {
        console.error("Erreur giveaway:", err);
      }
    }, duration);
  },
};

export const rerollCommand: Command = {
  name: "reroll",
  description: "Relancer le tirage d'un giveaway sans conditions",
  usage: "*reroll <ID du message>",
  execute: async (message, args) => {
    if (!message.member || !isModerator(message.member)) {
      await message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
      return;
    }

    const msgId = args[0];
    if (!msgId) {
      await message.reply("❌ Indique l'ID du message. Ex: `*reroll 123456789`");
      return;
    }

    const giveawayMsg = await message.channel.messages.fetch(msgId).catch(() => null);
    if (!giveawayMsg) {
      await message.reply("❌ Message introuvable.");
      return;
    }

    const reaction = giveawayMsg.reactions.cache.get("🎉");
    if (!reaction) {
      await message.reply("❌ Aucune réaction 🎉 trouvée.");
      return;
    }

    const users = await reaction.users.fetch();
    const candidates = users.filter(u => !u.bot);

    if (candidates.size === 0) {
      await message.reply("❌ Aucun participant.");
      return;
    }

    const gagnant = candidates.random();
    await message.channel.send(`🎊 Nouveau gagnant : <@${gagnant!.id}> !`);
  },
};
