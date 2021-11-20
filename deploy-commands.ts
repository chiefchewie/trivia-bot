import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { BOT_CLIENT_ID, DISCORD_TOKEN, DISCORD_GUILD_ID } from "./config.json";

const commands = [];
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".ts"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(DISCORD_TOKEN);

rest.put(Routes.applicationGuildCommands(BOT_CLIENT_ID, DISCORD_GUILD_ID), { body: commands })
    .then(() =>
        console.log(`YO!!!! Successfully registered ${commandFiles.length} application commands.`)
    )
    .catch(console.error);
