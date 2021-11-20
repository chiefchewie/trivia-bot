import fs from "fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
require("dotenv").config();

export function updateCommands() {
    const commands = [];
    const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".ts"));

    for (const file of commandFiles) {
        const command = require(`./commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN!);

    rest.put(
        Routes.applicationGuildCommands(process.env.BOT_CLIENT_ID!, process.env.DISCORD_GUILD_ID!),
        { body: commands }
    )
        .then(() =>
            console.log(
                `YO!!!! Successfully registered ${commandFiles.length} application commands.`
            )
        )
        .catch(console.error);
}
