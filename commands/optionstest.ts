import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("optionstest")
        .setDescription("pick and choose.")
        .addStringOption((option) =>
            option
                .setName("fruit")
                .setDescription("pick a fruit")
                .setRequired(true)
                .addChoice("Apple", "mmm apples")
                .addChoice("Oranges", "oooo oranges")
                .addChoice("Watermelon", "wooooow watermelon")
        ),
    async execute(interaction: CommandInteraction) {
        const fruitChoice = interaction.options.getString("fruit");
        await interaction.reply(
            `Yo, you really just chose ${fruitChoice} just now? Kinda weird bro...`
        );
    },
};
