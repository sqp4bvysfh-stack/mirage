import { EmbedBuilder } from "discord.js";
import type { Command } from "../types.js";
import { blockChannel, unblockChannel, getBlockedChannels } from "../utils/iaBlock.js";
import { extractId } from "../utils/serverConfig.js";

export const iablockCommand: Command = {
  name: "iablock",
  description: "Gérer les salons où l'IA ne répond pas (admin/modo)",
  usage: "*iablock <add|remove|liste> [#salon]",
  execute: async (message, args) => {
    const isAdmin = message.member?.permissions.has("Administrator");
    const isModo  = message.member?.permissions.has("ManageMessages");
    if (!isAdmin && !isModo) { await message.reply("❌ Réservé aux modérateurs."); return; }

    const guildId = message.guild!.id;
    const sub     = args[0]?.toLowerCase();

    // ── liste ─────────────────────────────────────────────────────────────────
    if (!sub || sub === "liste") {
      const blocked = getBlockedChannels(guildId);
      if (!blocked.length) {
        await message.reply("✅ Aucun salon bloqué — l'IA répond partout.");
        return;
      }
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🚫 Salons où l'IA ne répond pas")
        .setDescription(blocked.map(id => `<#${id}>`).join("\n"))
        .setFooter({ text: "*iablock add/remove #salon" });
      await message.reply({ embeds: [embed] });
      return;
    }

    // ── add ───────────────────────────────────────────────────────────────────
    if (sub === "add") {
      const raw = args[1];
      if (!raw) { await message.reply("❌ Usage : `*iablock add #salon`"); return; }
      const channelId = extractId(raw);
      const channel   = message.guild!.channels.cache.get(channelId);
      if (!channel) { await message.reply("❌ Salon introuvable."); return; }
      const ok = blockChannel(guildId, channelId);
      await message.reply(ok ? `✅ L'IA ne répondra plus dans ${channel}.` : `ℹ️ Ce salon est déjà bloqué.`);
      return;
    }

    // ── remove ────────────────────────────────────────────────────────────────
    if (sub === "remove") {
      const raw = args[1];
      if (!raw) { await message.reply("❌ Usage : `*iablock remove #salon`"); return; }
      const channelId = extractId(raw);
      const channel   = message.guild!.channels.cache.get(channelId);
      const ok = unblockChannel(guildId, channelId);
      await message.reply(ok ? `✅ L'IA peut à nouveau répondre dans ${channel ?? `<#${channelId}>`}.` : `ℹ️ Ce salon n'était pas bloqué.`);
      return;
    }

    await message.reply("❌ Usage : `*iablock <add|remove|liste> [#salon]`");
  },
};
