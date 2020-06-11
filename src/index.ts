// Shim required for typeorm
import "reflect-metadata";

import { CommandHandler } from "./CommandHandler";

import { Client } from "discord.js";
import { DB } from "./database";

import config from "../config.json";

const client = new Client();
const handler = new CommandHandler("!");

DB.connect().then(() => {
  client.on("ready", () => {
    console.log(`Logged in as ${client?.user && client.user.tag}!`);
  });

  client.on("message", (msg) => {
    handler.handle(msg);
  });

  client.login(config.discordToken);
});
