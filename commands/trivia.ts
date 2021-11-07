import { CommandInteraction, Message, MessageCollector, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { QuestionSpreadsheet } from "../spreadsheet";
import {
    GOOGLE_PRIVATE_KEY,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SHEET_ID,
    profile_pic_url,
} from "../config.json";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("trivia")
        .setDescription("start a round of trivia")
        .addIntegerOption((option) =>
            option
                .setName("difficulty")
                .setDescription("junior or senior")
                .setRequired(true)
                .addChoice("junior", 0)
                .addChoice("sernior", 1)
        ),
    async execute(interaction: CommandInteraction) {
        const TIME_TO_ANSWER: number = 10;
        interaction.reply("gotcha... starting a round of trivia");
        const difficultyChoce = interaction.options.getInteger("difficulty");
        const qs = new QuestionSpreadsheet(
            GOOGLE_SHEET_ID,
            GOOGLE_SERVICE_ACCOUNT_EMAIL,
            GOOGLE_PRIVATE_KEY
        );
        const question = await qs.getSeniorQuestions(3);
        for (const q of question) {
            var embed = new MessageEmbed({
                title: "here's a question for ya :)",
                description: q.question,
                timestamp: new Date().toString(),
                footer: {
                    text: "footer text...",
                },
                author: {
                    name: "rhhstrivia",
                    url: "https://www.instagram.com/rhhstrivia/",
                    icon_url: profile_pic_url,
                },
                fields: [
                    {
                        name: "topic",
                        value: q.topic,
                        inline: true,
                    },
                    {
                        name: "difficulty",
                        value: q.difficulty,
                        inline: true,
                    },
                ],
            });

            const message_filter = (msg: Message) => {
                return !msg.author.bot && msg.channel.id === interaction.channel?.id;
            };

            await interaction.channel?.send({ embeds: [embed] });

            const message_collector = interaction.channel?.createMessageCollector({
                filter: message_filter,
                time: TIME_TO_ANSWER * 1000,
            })!;

            message_collector.on("collect", async (msg) => {
                if (msg.content === q.answer) {
                    msg.channel.send(`correct! points go to ${msg.author}`);
                    message_collector.stop("answered");
                } else {
                    msg.channel.send("incorrect!");
                }
                console.log("received");
            });

            await new Promise((resolve) =>
                message_collector.once("end", async (collected, reason) => {
                    if (reason === "time") {
                        interaction.channel?.send(`Time's up! The correct answer was \"${q.answer}\"`);
                        console.log("time up");
                    }
                    resolve(reason);
                })
            );
        }
        interaction.channel?.send("that's the end of the round. thanks for playing");
    },
};
