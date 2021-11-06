import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";

module.exports = {
    data: new SlashCommandBuilder()
        .setName("echo")
        .setDescription("echoes the message")
        .addStringOption((option) =>
            option
                .setName("input")
                .setDescription("The input to echo back")
                .setRequired(true)
        ),
    async execute(interaction: CommandInteraction) {
        const userInput = interaction.options.getString("input")!;
        await interaction.reply(userInput);
    },
};
