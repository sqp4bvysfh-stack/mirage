import type { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export interface Command {
  data: Pick<SlashCommandBuilder, "name" | "toJSON">;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}
