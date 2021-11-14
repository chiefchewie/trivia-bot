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
                .setDescription("Select a difficulty")
                .setRequired(true)
                .addChoice("junior", 0)
                .addChoice("sernior", 1)
                .addChoice("both", 3)
        )
        .addIntegerOption((option) =>
            option.setName("count").setDescription("How many questions (max 20)").setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("gotcha... starting a round of trivia");
        const difficultyChoce = interaction.options.getInteger("difficulty");
        const TIME_TO_ANSWER: number = 10; // amount of time in seconds to answer each question
        const qs = new QuestionSpreadsheet(
            GOOGLE_SHEET_ID,
            GOOGLE_SERVICE_ACCOUNT_EMAIL,
            GOOGLE_PRIVATE_KEY
        );

        if (difficultyChoce === 3) {
        }

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

            // this filter will be used to filter messages
            const message_filter = (msg: Message) => {
                // if the author isn't a bot and it was sent in the right channel
                return !msg.author.bot && msg.channel.id === interaction.channel?.id;
            };

            var message_collector: MessageCollector;

            await interaction.channel?.send({ embeds: [embed] }).then(() => {
                // this message collector will use the above filter to collect messages
                message_collector = interaction.channel?.createMessageCollector({
                    filter: message_filter,
                    time: TIME_TO_ANSWER * 1000,
                })!;
            });

            // event - when a message is collected
            await new Promise((resolve) =>
                message_collector.on("collect", async (msg) => {
                    if (msg.content.toLowerCase() === q.answer.toLowerCase()) {
                        msg.channel.send(`correct! points go to ${msg.author}`);
                        message_collector.stop("answered");
                    } else {
                        msg.channel.send("incorrect!");
                    }
                    resolve("done");
                })
            );

            // event - when the message collector finishes
            await new Promise((resolve) =>
                message_collector.once("end", async (collected, reason) => {
                    if (reason === "time") {
                        interaction.channel?.send(
                            `Time's up! The correct answer was \"${q.answer}\"`
                        );
                    }
                    resolve(reason);
                })
            );
        }
        interaction.channel?.send("that's the end of the round. thanks for playing");
    },
};
