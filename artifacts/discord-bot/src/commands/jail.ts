import {
  ChannelType,
  EmbedBuilder,
  type GuildMember,
  type Role,
} from "discord.js";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

import type { Command } from "../types.js";
import { sendServerLog } from "../utils/logs.js";
import {
  canActOn,
  isModerator,
  JAIL_ROLE_ID,
} from "../utils/modCheck.js";

const PRISON_TEXT_CHANNEL_ID = "1528120878368559208";
const PRISON_VOICE_CHANNEL_ID = "1528120807396474930";

interface JailRecord {
  roles: string[];
  moderatorId: string;
  reason: string;
  jailedAt: number;
}

type JailStore = Record<string, JailRecord>;

const JAIL_FILE = (() => {
  try {
    if (!existsSync("/data")) mkdirSync("/data", { recursive: true });
    return "/data/jail-records.json";
  } catch {
    return join(process.cwd(), "jail-records.json");
  }
})();

let jailRecords: JailStore = {};

function loadJailRecords(): void {
  try {
    if (!existsSync(JAIL_FILE)) return;
    jailRecords = JSON.parse(readFileSync(JAIL_FILE, "utf-8")) as JailStore;
  } catch (error) {
    console.error("❌ Impossible de charger jail-records.json :", error);
    jailRecords = {};
  }
}

function saveJailRecords(): void {
  try {
    writeFileSync(
      JAIL_FILE,
      JSON.stringify(jailRecords, null, 2),
      "utf-8",
    );
  } catch (error) {
    console.error("❌ Impossible de sauvegarder jail-records.json :", error);
  }
}

loadJailRecords();

function getTarget(message: any, rawId?: string): Promise<GuildMember | null> {
  const mentioned = message.mentions.members?.first();
  if (mentioned) return Promise.resolve(mentioned);

  const userId = rawId?.replace(/[<@!>]/g, "");
  if (!userId) return Promise.resolve(null);

  return message.guild.members.fetch(userId).catch(() => null);
}

function getRestorableRoles(member: GuildMember): Role[] {
  const botMember = member.guild.members.me;
  if (!botMember) return [];

  return member.roles.cache
    .filter((role) =>
      role.id !== member.guild.id &&
      role.id !== JAIL_ROLE_ID &&
      !role.managed &&
      role.position < botMember.roles.highest.position
    )
    .sort((a, b) => b.position - a.position)
    .map((role) => role);
}

function findPrisonTextChannel(guild: any) {
  const configured = guild.channels.cache.get(PRISON_TEXT_CHANNEL_ID);

  if (configured?.type === ChannelType.GuildText) {
    return configured;
  }

  return guild.channels.cache.find(
    (channel: any) =>
      channel.type === ChannelType.GuildText &&
      channel.name.toLowerCase().includes("prison"),
  );
}

function findPrisonVoiceChannel(guild: any) {
  const configured = guild.channels.cache.get(PRISON_VOICE_CHANNEL_ID);

  if (configured?.type === ChannelType.GuildVoice) {
    return configured;
  }

  return guild.channels.cache.find(
    (channel: any) =>
      channel.type === ChannelType.GuildVoice &&
      channel.name.toLowerCase().includes("prison"),
  );
}

async function ensureJailPermissions(guild: any): Promise<void> {
  const prisonText = findPrisonTextChannel(guild);
  const prisonVoice = findPrisonVoiceChannel(guild);

  for (const channel of guild.channels.cache.values()) {
    if (!("permissionOverwrites" in channel)) continue;

    const isPrisonChannel =
      channel.id === prisonText?.id ||
      channel.id === prisonVoice?.id;

    await channel.permissionOverwrites.edit(
      JAIL_ROLE_ID,
      isPrisonChannel
        ? {
            ViewChannel: true,
            SendMessages: channel.type === ChannelType.GuildText ? true : null,
            Connect: channel.type === ChannelType.GuildVoice ? true : null,
            Speak: channel.type === ChannelType.GuildVoice ? true : null,
          }
        : {
            ViewChannel: false,
          },
    ).catch((error: unknown) => {
      console.error(`Erreur permissions Jail sur ${channel.id}:`, error);
    });
  }
}

export const jailCommand: Command = {
  name: "jail",
  description: "Met un membre en prison et sauvegarde ses rôles",
  usage: "*jail @membre [raison]",

  execute: async (message, args) => {
    if (!message.guild || !message.member) return;

    if (!isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const member = await getTarget(message, args[0]);

    if (!member) {
      await message.reply("❌ Membre introuvable.");
      return;
    }

    if (!canActOn(message.member, member)) {
      await message.reply(
        "❌ Tu ne peux pas emprisonner ce membre à cause de la hiérarchie.",
      );
      return;
    }

    if (member.roles.cache.has(JAIL_ROLE_ID)) {
      await message.reply("⚠️ Ce membre est déjà en prison.");
      return;
    }

    const jailRole = message.guild.roles.cache.get(JAIL_ROLE_ID);
    if (!jailRole) {
      await message.reply("❌ Le rôle Jail est introuvable.");
      return;
    }

    const rolesToRemove = getRestorableRoles(member);
    const reason = args.slice(1).join(" ").trim() || "Aucune raison précisée";

    jailRecords[member.id] = {
      roles: rolesToRemove.map((role) => role.id),
      moderatorId: message.author.id,
      reason,
      jailedAt: Date.now(),
    };
    saveJailRecords();

    await ensureJailPermissions(message.guild);

    if (rolesToRemove.length > 0) {
      await member.roles.remove(
        rolesToRemove,
        `Jail par ${message.author.tag} : ${reason}`,
      );
    }

    await member.roles.add(
      jailRole,
      `Jail par ${message.author.tag} : ${reason}`,
    );

    const prisonVoice = findPrisonVoiceChannel(message.guild);
    if (member.voice.channel && prisonVoice) {
      await member.voice.setChannel(prisonVoice).catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(0x6d28d9)
      .setTitle("🔒 Membre emprisonné")
      .addFields(
        { name: "Membre", value: `${member}`, inline: true },
        { name: "Modérateur", value: `${message.author}`, inline: true },
        { name: "Raison", value: reason },
        {
          name: "Rôles sauvegardés",
          value: String(rolesToRemove.length),
          inline: true,
        },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendServerLog(message.guild, { embeds: [embed] });
  },
};

export const unjailCommand: Command = {
  name: "unjail",
  description: "Libère un membre et restaure ses rôles",
  usage: "*unjail @membre",

  execute: async (message, args) => {
    if (!message.guild || !message.member) return;

    if (!isModerator(message.member)) {
      await message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
      return;
    }

    const member = await getTarget(message, args[0]);

    if (!member) {
      await message.reply("❌ Membre introuvable.");
      return;
    }

    if (!member.roles.cache.has(JAIL_ROLE_ID)) {
      await message.reply("⚠️ Ce membre n’est pas en prison.");
      return;
    }

    const record = jailRecords[member.id];

    await member.roles.remove(
      JAIL_ROLE_ID,
      `Libération par ${message.author.tag}`,
    );

    let restored = 0;
    let failed = 0;

    if (record) {
      const botMember = message.guild.members.me;

      for (const roleId of record.roles) {
        const role = message.guild.roles.cache.get(roleId);

        if (
          !role ||
          role.managed ||
          !botMember ||
          role.position >= botMember.roles.highest.position
        ) {
          failed += 1;
          continue;
        }

        const success = await member.roles
          .add(role, `Restauration après unjail par ${message.author.tag}`)
          .then(() => true)
          .catch(() => false);

        if (success) restored += 1;
        else failed += 1;
      }

      delete jailRecords[member.id];
      saveJailRecords();
    }

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🔓 Membre libéré")
      .addFields(
        { name: "Membre", value: `${member}`, inline: true },
        { name: "Modérateur", value: `${message.author}`, inline: true },
        { name: "Rôles restaurés", value: String(restored), inline: true },
        { name: "Échecs", value: String(failed), inline: true },
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
    await sendServerLog(message.guild, { embeds: [embed] });
  },
};
