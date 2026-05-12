import { EmbedBuilder, type TextChannel, type Message } from "discord.js";
import type { Command } from "../types.js";
import { BOT_OWNER_ID } from "./owner.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";

const FILE = "/data/coinsetup.json";
const store: Record<string, { channelId: string; roleId: string; messageId: string }> = {};
try { Object.assign(store, JSON.parse(readFileSync(FILE, "utf-8"))); } catch {}
function save() {
  if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
  writeFileSync(FILE, JSON.stringify(store, null, 2));
}

export function getCoinSetup(guildId: string) { return store[guildId]; }
export function setCoinSetup(guildId: string, data: { channelId: string; roleId: string; messageId: string }) {
  store[guildId] = data;
  save();
}

export const coinsetupCommand: Command = {
  name: "coinsetup",
  description: "Créer le message d'accès au salon coins (admin)",
  usage: "&coinsetup",
  execute: async (message) => {
    const isAdmin = message.member?.permissions.has("Administrator");
    const isOwner = message.author.id === BOT_OWNER_ID;
    if (!isAdmin && !isOwner) { await message.reply("❌ Réservé aux administrateurs."); return; }
    if (!message.channel.isTextBased()) return;

    const ch = message.channel as TextChannel;
    const guild = message.guild!;
    const authorId = message.author.id;

    await ch.send("📋 **Setup accès coins — étape 1/2**\nEnvoie l'**ID du salon** où poster le message d'accès.");

    const filter = (m: Message) => m.author.id === authorId;
    const col = ch.createMessageCollector({ filter, max: 1, time: 60_000 });

    col.on("collect", async (m1: Message) => {
      const channelId = m1.content.trim();
      const channel   = guild.channels.cache.get(channelId);
      if (!channel?.isTextBased()) {
        await ch.send("❌ Salon introuvable. Recommence avec `&coinsetup`."); return;
      }

      await ch.send("📋 **Étape 2/2**\nEnvoie l'**ID du rôle** à donner aux membres qui réagissent.");
      const col2 = ch.createMessageCollector({ filter, max: 1, time: 60_000 });

      col2.on("collect", async (m2: Message) => {
        const roleId = m2.content.trim();
        const role   = guild.roles.cache.get(roleId);
        if (!role) { await ch.send("❌ Rôle introuvable. Recommence avec `&coinsetup`."); return; }

        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("💰 Accès au système économique")
          .setDescription(
            `Réagis avec ✅ pour obtenir le rôle **${role.name}** et accéder au salon coins !\n\n` +
            `Tu pourras utiliser toutes les commandes \`&\` : daily, work, braquer, tycoon, casino...`
          )
          .setFooter({ text: "Un seul clic suffit !" });

        const posted = await (channel as TextChannel).send({ embeds: [embed] });
        await posted.react("✅");
        setCoinSetup(guild.id, { channelId, roleId, messageId: posted.id });
        await ch.send(`✅ Message posté dans ${channel} ! Les membres qui réagissent recevront le rôle **${role.name}**.`);
      });

      col2.on("end", (_: unknown, reason: string) => {
        if (reason === "time") ch.send("⏱ Temps écoulé.").catch(() => {});
      });
    });

    col.on("end", (_: unknown, reason: string) => {
      if (reason === "time") ch.send("⏱ Temps écoulé.").catch(() => {});
    });
  },
};
