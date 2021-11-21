import DiscordJS, { Collection, Intents } from "discord.js";
import fs from "fs";
import { google } from "googleapis";
import _ from "lodash";
import path from "path";
import { updateCommands } from "./deploy-commands";
require("dotenv").config();

// create google api client
const gsClient = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    undefined,
    _.replace(process.env.GOOGLE_PRIVATE_KEY!, /\\n/g, "\n"),
    ["https://www.googleapis.com/auth/spreadsheets"]
);

// Create discord client
const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

const dir = "./commands";

const commandFiles = fs.readdirSync(path.resolve(__dirname, dir));

const client_commands = new Collection<String, any>();

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
    updateCommands();
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
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            ephemeral: true,
        });
    }
});

client.login(process.env.DISCORD_TOKEN);
