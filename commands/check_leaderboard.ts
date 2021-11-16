/**
 * /help
 * Send a useful guide to using this bot
 */
import { Client, CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getLeaderboards } from "../spreadsheet";
import * as env from "../config.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboards")
        .setDescription("check the leaderboards"),
    async execute(interaction: CommandInteraction, client: Client ) {
        const top10 = await getLeaderboards({
            path_to_keyfile: env.GOOGLE_KEYFILE,
            sheet_id: env.GOOGLE_SHEET_ID,
        });

        const embed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("le leaderboard")
        .setAuthor("Some name", "https://i.imgur.com/AfFp7pu.png", "https://discord.js.org")
        .setTimestamp()
        
        for (let index = 0; index < top10.length; index++) {
            const user_ranking = top10[index];
            const user = client.users.cache.get(user_ranking.uid);
            const tag = user?.tag;
            const field = `\n${index + 1}. ${tag}`;
            embed.addField(field, user_ranking.all_time.toString());
        }
        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};
