import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";

const CODE_SECRET = "0420";
const NOM_ROLE = "📱";

export const telephoneCommand: Command = {
  name: "telephone",
  description: "Accéder au téléphone (Murder Mystery)",
  usage: "*telephone",
  execute: async (message) => {
    const member = message.member;
    const guild = message.guild;
    if (!member || !guild) return;

    await message.delete().catch(() => {});

    const roleExistant = guild.roles.cache.find(r => r.name === NOM_ROLE);
    if (roleExistant && member.roles.cache.has(roleExistant.id)) {
      const dm = await message.author.createDM().catch(() => null);
      if (dm) await dm.send("📱 Tu as déjà accès au téléphone !").catch(() => {});
      return;
    }

    const dm = await message.author.createDM().catch(() => null);
    if (!dm) {
      const msg = await message.channel.send(
        `${message.author}, active tes messages privés pour utiliser cette commande !`
      );
      setTimeout(() => msg.delete().catch(() => {}), 5000);
      return;
    }

    const askEmbed = new EmbedBuilder()
      .setColor(0x2c2f33)
      .setTitle("🔒 Téléphone verrouillé")
      .setDescription("Quel est le **code du téléphone** ?\n\nTu as **3 tentatives** et **60 secondes**.")
      .setFooter({ text: "Réponds ici avec le code" })
      .setTimestamp();

    await dm.send({ embeds: [askEmbed] });

    let tentatives = 0;

    const collector = dm.createMessageCollector({
      filter: (m) => !m.author.bot,
      time: 60000,
    });

    collector.on("collect", async (m) => {
      tentatives++;

      if (m.content.trim() === CODE_SECRET) {
        collector.stop("correct");

        const role = guild.roles.cache.find(r => r.name === NOM_ROLE);
        if (role) {
          await member.roles.add(role).catch(() => {});
        }

        const successEmbed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("✅ Accès accordé")
          .setDescription("Le téléphone se déverrouille...\n\nTu as maintenant accès au salon 📱 !")
          .setTimestamp();
        await dm.send({ embeds: [successEmbed] });

      } else {
        const restantes = 3 - tentatives;
        if (restantes <= 0) {
          collector.stop("failed");
          return;
        }
        const failEmbed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("❌ Accès refusé")
          .setDescription(`Code incorrect.\nIl te reste **${restantes} tentative${restantes > 1 ? "s" : ""}**.`)
          .setTimestamp();
        await dm.send({ embeds: [failEmbed] });
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await dm.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x95a5a6)
              .setTitle("⏰ Session expirée")
              .setDescription("Tu as mis trop de temps. Réessaie avec `*telephone`.")
              .setTimestamp()
          ]
        }).catch(() => {});
      } else if (reason === "failed") {
        await dm.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0xe74c3c)
              .setTitle("🔒 Accès bloqué")
              .setDescription("Trop de tentatives incorrectes.")
              .setTimestamp()
          ]
        }).catch(() => {});
      }
    });
  },
};