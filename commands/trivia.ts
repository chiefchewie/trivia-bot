import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { QuestionSpreadsheet } from "../spreadsheet";
import { GOOGLE_PRIVATE_KEY, GOOGLE_SERVICE_ACCOUNT_EMAIL } from "../config.json";

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
        const difficultyChoce = interaction.options.getInteger("difficulty");
        const qs = new QuestionSpreadsheet(
            "1-368THFNircUUSvUJGe9GuH2rAnU8ZKPeahuAG8K7iA",
            GOOGLE_SERVICE_ACCOUNT_EMAIL,
            GOOGLE_PRIVATE_KEY
        );
        const question = await qs.getSeniorQuestions(1);
        await interaction.reply({content:"bruh", embeds:question});
    },
};
