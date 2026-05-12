import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, type Interaction, ComponentType } from "discord.js";
import type { Command } from "../types.js";
import { getUser, saveUser, fmt, rand } from "../utils/economy.js";
import { getEcoConfig } from "../utils/ecoConfig.js";

// ─── Roulette ─────────────────────────────────────────────────────────────────

const ROUGES = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const NOIRS  = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

export const rouletteCommand: Command = {
  name: "roulette",
  description: "Jouer à la roulette",
  usage: "&roulette <montant|all> <rouge|noir|pair|impair|0-36>",
  execute: async (message, args) => {
    const guildId = message.guild!.id;
    const userId  = message.author.id;
    const cfg     = getEcoConfig(guildId);
    const u       = getUser(guildId, userId);

    const rawMontant = args[0]?.toLowerCase();
    const choix      = args[1]?.toLowerCase();
    const montant    = rawMontant === "all" ? u.poche : parseInt(rawMontant ?? "");

    if (isNaN(montant) || montant <= 0 || !choix) {
      await message.reply("❌ Usage : `&roulette <montant|all> <rouge|noir|pair|impair|0-36>`"); return;
    }
    if (u.poche < montant) {
      await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return;
    }

    const numero  = Math.floor(Math.random() * 37);
    const couleur = numero === 0 ? "vert" : ROUGES.includes(numero) ? "rouge" : "noir";
    let gain  = 0;
    let gagné = false;

    if (choix === "rouge"  && couleur === "rouge")                          { gain = montant;      gagné = true; }
    else if (choix === "noir"   && couleur === "noir")                      { gain = montant;      gagné = true; }
    else if (choix === "pair"   && numero !== 0 && numero % 2 === 0)       { gain = montant;      gagné = true; }
    else if (choix === "impair" && numero % 2 === 1)                       { gain = montant;      gagné = true; }
    else if (!isNaN(parseInt(choix)) && parseInt(choix) === numero)        { gain = montant * 35; gagné = true; }

    const emoji = couleur === "rouge" ? "🔴" : couleur === "noir" ? "⚫" : "🟢";
    if (gagné) { u.poche += gain; u.totalEarned += gain; }
    else        { u.poche -= montant; }
    saveUser(guildId, userId, u);

    const embed = new EmbedBuilder()
      .setColor(gagné ? 0x2ecc71 : 0xe74c3c)
      .setTitle(`🎰 Roulette — ${emoji} **${numero}** (${couleur})`)
      .setDescription(
        gagné
          ? `✅ Gagné ! Tu remportes ${fmt(gain, cfg.monnaie)} !`
          : `❌ Perdu. Tu perds ${fmt(montant, cfg.monnaie)}.`
      )
      .addFields({ name: "Poche", value: fmt(u.poche, cfg.monnaie), inline: true });
    await message.reply({ embeds: [embed] });
  },
};

// ─── Blackjack ────────────────────────────────────────────────────────────────

type Carte = { val: string; pts: number };

function pioche(): Carte {
  const cartes = ["A","2","3","4","5","6","7","8","9","10","V","D","R"];
  const val    = cartes[Math.floor(Math.random() * cartes.length)]!;
  const pts    = val === "A" ? 11 : ["V","D","R"].includes(val) ? 10 : parseInt(val);
  return { val, pts };
}

function score(main: Carte[]): number {
  let total = main.reduce((s, c) => s + c.pts, 0);
  let as    = main.filter(c => c.val === "A").length;
  while (total > 21 && as > 0) { total -= 10; as--; }
  return total;
}

function affMain(main: Carte[]): string {
  return main.map(c => `\`${c.val}\``).join(" ");
}

async function jouerBlackjack(message: any, args: string[]) {
  const guildId = message.guild!.id;
  const userId  = message.author.id;
  const cfg     = getEcoConfig(guildId);
  const u       = getUser(guildId, userId);

  const raw     = args[0]?.toLowerCase();
  const montant = raw === "all" ? u.poche : parseInt(raw ?? "");

  if (isNaN(montant) || montant <= 0) {
    await message.reply("❌ Usage : `&blackjack <montant|all>`"); return;
  }
  if (u.poche < montant) {
    await message.reply(`❌ Poche insuffisante (${fmt(u.poche, cfg.monnaie)}).`); return;
  }

  let joueur: Carte[] = [pioche(), pioche()];
  let dealer: Carte[] = [pioche(), pioche()];
  let mise = montant;

  const buildEmbed = (fin: boolean): EmbedBuilder => {
    const sj = score(joueur);
    const sd = score(dealer);
    const e  = new EmbedBuilder().setColor(0x2c3e50).setTitle("🃏 Blackjack").addFields(
      { name: `Toi (${sj})`,          value: affMain(joueur),                              inline: true },
      { name: `Dealer (${fin ? sd : "?"})`, value: fin ? affMain(dealer) : `\`${dealer[0]!.val}\` \`?\``, inline: true },
    );
    return e;
  };

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("bj_tirer").setLabel("🃏 Tirer").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("bj_rester").setLabel("✋ Rester").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("bj_doubler").setLabel("⚡ Doubler").setStyle(ButtonStyle.Danger),
  );

  const msg = await message.reply({ embeds: [buildEmbed(false)], components: [row] });

  if (score(joueur) === 21) {
    const gain = Math.floor(mise * 1.5);
    u.poche += gain; u.totalEarned += gain;
    saveUser(guildId, userId, u);
    const e = buildEmbed(true).setColor(0xf1c40f).setDescription(`🎉 Blackjack ! +${fmt(gain, cfg.monnaie)}`);
    await msg.edit({ embeds: [e], components: [] });
    return;
  }

  const fin = async (raison: string, couleur: number): Promise<void> => {
    saveUser(guildId, userId, u);
    const e = buildEmbed(true).setColor(couleur).setDescription(raison);
    await msg.edit({ embeds: [e], components: [] }).catch(() => {});
  };

  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    filter: (i: any) => i.user.id === userId,
    time: 60_000,
  });

  collector.on("collect", async (i: Interaction) => {
    if (!i.isButton()) return;
    await i.deferUpdate();
    const id = i.customId;

    if (id === "bj_tirer" || id === "bj_doubler") {
      if (id === "bj_doubler") {
        if (u.poche < mise) {
          await msg.reply("❌ Poche insuffisante pour doubler.").catch(() => {});
          return;
        }
        u.poche -= mise;
        mise    *= 2;
      }
      joueur.push(pioche());
      const sj = score(joueur);
      if (sj > 21) {
        u.poche -= mise;
        collector.stop();
        await fin(`💥 Bust ! Tu dépasses 21. Tu perds ${fmt(mise, cfg.monnaie)}.`, 0xe74c3c);
        return;
      }
      if (sj === 21 || id === "bj_doubler") {
        while (score(dealer) < 17) dealer.push(pioche());
        const sd  = score(dealer);
        const sj2 = score(joueur);
        if (sd > 21 || sj2 > sd) {
          u.poche += mise; u.totalEarned += mise;
          collector.stop();
          await fin(`✅ Tu gagnes ! Dealer : ${sd}. +${fmt(mise, cfg.monnaie)}`, 0x2ecc71);
        } else if (sj2 === sd) {
          collector.stop();
          await fin(`🤝 Égalité — mise remboursée.`, 0x95a5a6);
        } else {
          u.poche -= mise;
          collector.stop();
          await fin(`❌ Perdu ! Dealer : ${sd}. -${fmt(mise, cfg.monnaie)}`, 0xe74c3c);
        }
        return;
      }
      await msg.edit({ embeds: [buildEmbed(false)], components: [row] }).catch(() => {});
      return;
    }

    if (id === "bj_rester") {
      while (score(dealer) < 17) dealer.push(pioche());
      const sd = score(dealer);
      const sj = score(joueur);
      if (sd > 21 || sj > sd) {
        u.poche += mise; u.totalEarned += mise;
        collector.stop();
        await fin(`✅ Tu gagnes ! Dealer : ${sd}. +${fmt(mise, cfg.monnaie)}`, 0x2ecc71);
      } else if (sj === sd) {
        collector.stop();
        await fin(`🤝 Égalité — mise remboursée.`, 0x95a5a6);
      } else {
        u.poche -= mise;
        collector.stop();
        await fin(`❌ Perdu ! Dealer : ${sd}. -${fmt(mise, cfg.monnaie)}`, 0xe74c3c);
      }
    }
  });

  collector.on("end", async (_: any, reason: string) => {
    if (reason === "time") {
      u.poche -= mise;
      await fin(`⏱ Temps écoulé — tu perds ta mise de ${fmt(mise, cfg.monnaie)}.`, 0xe74c3c);
    }
  });
}

export const blackjackCommand: Command = {
  name: "blackjack",
  description: "Jouer au blackjack",
  usage: "&blackjack <montant|all>",
  execute: jouerBlackjack,
};

export const bjCommand: Command = {
  name: "bj",
  description: "Alias de &blackjack",
  usage: "&bj <montant|all>",
  execute: jouerBlackjack,
};
