/**
 * /help
 * Send a useful guide to using this bot
 */
import { Client, CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { google } from "googleapis";
import { JWT } from "googleapis-common";
import _ from "lodash";
import * as env from "../config.json";

interface UserRanking {
    uid: string;
    all_time: number;
    monthly: number;
    weekly: number;
    daily: number;
}

async function getLeaderboards(google_auth: JWT) {
    const client = google_auth;
    const sheetsapi = google.sheets({
        version: "v4",
        auth: client,
    });

    // Get top 10 users (skip header row, columns A2 to E10 )
    const rows = await sheetsapi.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `Users!A2:E`,
    });

    const rankings: UserRanking[] = [];
    rows.data.values?.forEach((element) => {
        rankings.push({
            uid: element[0],
            all_time: element[1],
            monthly: element[2],
            weekly: element[3],
            daily: element[4],
        });
    });

    return rankings;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("leaderboards")
        .setDescription("check the leaderboards"),
    async execute(interaction: CommandInteraction, bot_client: Client, gs_client: JWT) {
        await interaction.deferReply();

        // get records
        const top10 = await getLeaderboards(gs_client);

        const embed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("le leaderboard")
            .setAuthor("Some name", "https://i.imgur.com/AfFp7pu.png", "https://discord.js.org")
            .setTimestamp();

        // add the top ten to the embed
        for (let index = 0; index < top10.length; index++) {
            const user_ranking = top10[index];
            const user = bot_client.users.cache.get(user_ranking.uid);
            const tag = user?.tag;
            const field = `\n${index + 1}. ${tag}`;
            embed.addField(field, user_ranking.all_time.toString());
        }

        // finally, send the information to the deferred reply
        await interaction.editReply({ embeds: [embed] });
    },
};
