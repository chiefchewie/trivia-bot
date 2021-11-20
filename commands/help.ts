/**
 * /help
 * Send a useful guide to using this bot
 */
import { CommandInteraction, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { PFP_URL } from "../config.json";

module.exports = {
    data: new SlashCommandBuilder().setName("help").setDescription("need help???"),
    async execute(interaction: CommandInteraction) {
        const embed = new MessageEmbed()
            .setColor("#0099ff")
            .setTitle("using this bot")
            .setAuthor("rhhstrivia", PFP_URL, "https://www.instagram.com/rhhstrivia/")
            .setDescription("how to use the commands")
            .setThumbnail(
                "https://www.pngkey.com/png/full/460-4601531_question-makrs-question-mark-anime-png.png"
            )
            .addFields(
                { name: "Regular field title", value: "Some value here" },
                { name: "/help", value: "shows this message" },
                {
                    name: "/trivia <difficulty> <count=5>",
                    value: "start a round of trivia. select a difficulty and how many questions you want.",
                },
                { name: "/leaderboards", value: "show the top 10" }
                //{ name: "\u200B", value: "\u200B" },
            )
            .setTimestamp()
            .setFooter("This is a footer.", "https://i.imgur.com/AfFp7pu.png");

        await interaction.reply({ embeds: [embed], ephemeral: false });
    },
};
