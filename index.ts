import fs from "fs";
import DiscordJS, { Collection, Intents } from "discord.js";
import { DISCORD_TOKEN } from "./config.json";
import { google } from "googleapis";
import * as env from "./config.json";
// create google api client
const gsClient = new google.auth.JWT(
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    env.GOOGLE_PRIVATE_KEY,
    ["https://www.googleapis.com/auth/spreadsheets"]
);

// Create discord client
const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Load commands
const client_commands = new Collection<String, any>();
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".ts")); // if using javascript change this to ".js"

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client_commands.set(command.data.name, command);
}

// Do things when client is online
// Put the bot's activity and status here
client.on("ready", () => {
    console.log("D.Va online!");
});

// Handle commands
client.on("interactionCreate", async (interaction) => {
    // return if the interaction isn't a command
    if (!interaction.isCommand()) {
        return;
    }

    // get the relevant command, and return if it doesn't exist
    const command = client_commands.get(interaction.commandName);
    if (!command) {
        return;
    }

    try {
        await command.execute(interaction, client, gsClient);
        console.log("finished executing command", interaction.commandName);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});

client.login(DISCORD_TOKEN);
