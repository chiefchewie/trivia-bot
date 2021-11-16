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
        await interaction.deferReply()

        // get records
        const top10 = await getLeaderboards({
            path_to_keyfile: env.GOOGLE_KEYFILE,
            sheet_id: env.GOOGLE_SHEET_ID,
        });

        const embed = new MessageEmbed()
        .setColor("#0099ff")
        .setTitle("le leaderboard")
        .setAuthor("Some name", "https://i.imgur.com/AfFp7pu.png", "https://discord.js.org")
        .setTimestamp()
        
        // add the top ten to the embed
        for (let index = 0; index < top10.length; index++) {
            const user_ranking = top10[index];
            const user = client.users.cache.get(user_ranking.uid);
            const tag = user?.tag;
            const field = `\n${index + 1}. ${tag}`;
            embed.addField(field, user_ranking.all_time.toString());
        }

        // finally, send the information to the deferred reply
        await interaction.editReply({ embeds: [embed]});
    },
};
