import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import fs from "fs";
import path from "path";
require("dotenv").config();

export function updateCommands() {
    const commands = [];
    const dir = "./commands";
    const commandFiles = fs.readdirSync(path.resolve(__dirname, dir));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!);

    rest.put(
        /* Do this for guild commands (testing environment) */
        // Routes.applicationGuildCommands(process.env.BOT_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
        Routes.applicationCommands(process.env.BOT_CLIENT_ID!),
        { body: commands }
    )
        .then(() =>
            console.log(
                `YO!!!! Successfully registered ${commandFiles.length} application commands.`
            )
        )
        .catch(console.error);
}
