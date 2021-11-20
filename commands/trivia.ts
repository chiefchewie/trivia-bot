import { Client, CommandInteraction, Message, MessageCollector, MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { random } from "lodash";
import { JWT } from "googleapis-common";
import { google } from "googleapis";
import * as env from "../config.json";
import _ from "lodash";

interface TriviaQuestion {
    question: string;
    answer: string;
    difficulty: string;
    topic: string;
}

async function getQuestions(
    google_auth: JWT,
    difficulty: "Junior" | "Senior",
    question_count: number
) {
    const client = google_auth;
    const sheetsapi = google.sheets({
        version: "v4",
        auth: client,
    });

    // Get all questions (Columns A to D, skip row 1 the header row)
    const rows = await sheetsapi.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: `${difficulty} Questions!A2:D`,
    });

    // Sample random questions and return them
    const random_sample = _.sampleSize(rows.data.values, question_count);
    const questions: TriviaQuestion[] = [];
    random_sample.forEach((row) => {
        var trivia_question: TriviaQuestion = {
            question: row[0],
            answer: row[1],
            difficulty: row[2],
            topic: row[3],
        };
        questions.push(trivia_question);
    });

    return questions;
}

async function updateLeaderboards(google_auth: JWT, user_id: string) {
    // Log in and authenticate Google API client
    const client = google_auth;
    const sheetsapi = google.sheets({
        version: "v4",
        auth: client,
    });

    // Store a copy of all records first
    const all_data = await sheetsapi.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEET_ID,
        range: "Users!A2:E",
    });

    // use google sheets' MATCH function to find the index of a user
    const search_request = {
        // The ID of the spreadsheet to update.
        spreadsheetId: env.GOOGLE_SHEET_ID,

        // The A1 notation of the values to update.
        range: "Users!F1",

        // How the input data should be interpreted.
        valueInputOption: "USER_ENTERED",

        includeValuesInResponse: true,

        resource: {
            values: [[`=MATCH(\"${user_id}\", A:A, 0)`]],
        },

        auth: client,
    };
    const response = (await sheetsapi.spreadsheets.values.update(search_request)).data;

    const user_rowNumber = response.updatedData?.values![0][0];

    if (user_rowNumber === "#N/A") {
        // user not currently in database
        // so we need to at them to the database
        const append_request = {
            spreadsheetId: env.GOOGLE_SHEET_ID,
            range: `Users!A:B`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            resource: {
                values: [[user_id, 10]], // 10 is value per question
            },
        };
        await sheetsapi.spreadsheets.values.append(append_request);
    } else {
        // user already in database
        // so we need to update their values
        // first - get their current value
        const score = parseInt(all_data.data.values![user_rowNumber - 2][1]);
        const update_request = {
            spreadsheetId: env.GOOGLE_SHEET_ID,
            range: `Users!B${user_rowNumber}`,
            valueInputOption: "USER_ENTERED",
            resource: {
                range: `Users!B${user_rowNumber}`,
                values: [[score + 10]],
            },
        };
        await sheetsapi.spreadsheets.values.update(update_request);
    }
}

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
        )
        .addIntegerOption((option) =>
            option
                .setName("count")
                .setDescription("how many questions for this round. default = 5")
                .setRequired(false)
        ),
    async execute(interaction: CommandInteraction, bot_client: Client, gs_client: JWT) {
        // Constants
        const TIME_TO_ANSWER: number = 10; // amount of time in seconds to answer each question
        const difficultyChoice = interaction.options.getInteger("difficulty")!;
        const questionCount =
            interaction.options.getInteger("count") !== null
                ? interaction.options.getInteger("count")!
                : 5;

        await interaction.reply("gotcha... starting a round of trivia");

        // Get questions
        var questions: TriviaQuestion[];

        if (difficultyChoice === 1) {
            // senior
            questions = await getQuestions(gs_client, "Senior", questionCount);
        } else {
            // junior
            questions = await getQuestions(gs_client, "Junior", questionCount);
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
                    icon_url: env.PFP_URL,
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
            // so we can keep collecting messages until
            // a) the correct answer was sent, or b) time has run out to answer
            const message_collector = interaction.channel?.createMessageCollector({
                filter: message_filter,
                time: TIME_TO_ANSWER * 1000,
            })!;

            // event - when a message is collected
            message_collector.on("collect", async (msg) => {
                // check if answer is correct
                if (msg.content.toLowerCase() === q.answer.toLowerCase()) {
                    await msg.channel.send(`correct! points go to ${msg.author}`);
                    await updateLeaderboards(gs_client, msg.author.id);
                    message_collector.stop("answered");
                } else {
                    msg.channel.send("incorrect!");
                }
            });

            // event - when the message collector finishes
            await new Promise((resolve) =>
                message_collector.once("end", async (collected, reason) => {
                    if (reason === "time") {
                        const answer_embed = new MessageEmbed()
                            .setColor("#0099ff")
                            .setDescription(`Answer: ${q.answer}`);
                        interaction.channel?.send({
                            embeds: [answer_embed],
                        });
                    }
                    resolve(reason);
                })
            );
        }
        interaction.channel?.send("that's the end of the round. thanks for playing");
    },
};
