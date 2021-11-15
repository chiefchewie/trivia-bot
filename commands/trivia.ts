import { CommandInteraction, Message, MessageCollector, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getQuestions, TriviaQuestion } from "../spreadsheet";
import {
    GOOGLE_KEYFILE,
    GOOGLE_PRIVATE_KEY,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SHEET_ID,
    profile_pic_url,
} from "../config.json";
import { random } from "lodash";

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
                .addChoice("senior", 1)
                .addChoice("both", 2)
        )
        .addIntegerOption((option) =>
            option
                .setName("count")
                .setDescription("how many questions for this round. default = 5")
                .setRequired(false)
        ),
    async execute(interaction: CommandInteraction) {
        await interaction.reply("gotcha... starting a round of trivia");
        const TIME_TO_ANSWER: number = 10; // amount of time in seconds to answer each question
        const difficultyChoice = interaction.options.getInteger("difficulty")!;
        const questionCount =
            interaction.options.getInteger("count") !== null
                ? interaction.options.getInteger("count")!
                : 5;

        var questions: TriviaQuestion[];

        if (difficultyChoice === 2) {
            // both
            var j_count = random(0, questionCount);
            var junior_questions = await getQuestions({
                difficulty: "Junior",
                sheet_id: GOOGLE_SHEET_ID,
                path_to_keyfile: GOOGLE_KEYFILE,
                question_count: j_count,
            });
            var senior_questions = await getQuestions({
                difficulty: "Senior",
                sheet_id: GOOGLE_SHEET_ID,
                path_to_keyfile: GOOGLE_KEYFILE,
                question_count: questionCount - j_count,
            });
            questions = junior_questions.concat(senior_questions);
        } else if (difficultyChoice == 1) {
            // senior
            questions = await getQuestions({
                difficulty: "Senior",
                sheet_id: GOOGLE_SHEET_ID,
                path_to_keyfile: GOOGLE_KEYFILE,
                question_count: questionCount,
            });
        } else {
            // junior
            questions = await getQuestions({
                difficulty: "Junior",
                sheet_id: GOOGLE_SHEET_ID,
                path_to_keyfile: GOOGLE_KEYFILE,
                question_count: questionCount,
            });
        }

        for (const q of questions) {
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

            await interaction.channel?.send({ embeds: [embed] });

            // this filter will be used to filter messages
            const message_filter = (msg: Message) => {
                // if the author isn't a bot and it was sent in the right channel
                return !msg.author.bot && msg.channel.id === interaction.channel?.id;
            };

            // this message collector will use the above filter to collect messages
            const message_collector = interaction.channel?.createMessageCollector({
                filter: message_filter,
                time: TIME_TO_ANSWER * 1000,
            })!;

            // event - when a message is collected
            message_collector.on("collect", async (msg) => {
                if (msg.content.toLowerCase() === q.answer.toLowerCase()) {
                    msg.channel.send(`correct! points go to ${msg.author}`);
                    message_collector.stop("answered");
                } else {
                    msg.channel.send("incorrect!");
                }
            });

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
