// deploy-commands.js — Orchid Hunter DEV bot
// Registers all slash commands (ping, save-me, delete-me, view-me, link-wallet, verify-wallet)

require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const commands = [
  // 🔗 /link-wallet
  new SlashCommandBuilder()
    .setName('link-wallet')
    .setDescription('Link your Wax wallet to your Discord account.')
    .addStringOption((option) =>
      option
        .setName('wallet')
        .setDescription('Your Wax wallet ID (e.g. abcd1.wam)')
        .setRequired(true)
    ),

  // 🪙 /verify-wallet
  new SlashCommandBuilder()
    .setName('verify-wallet')
    .setDescription('Verify ownership of your Wax wallet by signing your code.')
    .addStringOption((option) =>
      option
        .setName('signature')
        .setDescription('Your signed verification code')
        .setRequired(true)
    ),

  // 👀 /view-me
  new SlashCommandBuilder()
    .setName('view-me')
    .setDescription('View your saved data from DynamoDB.'),

  // 🏓 /ping
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),

  // 💾 /save-me
  new SlashCommandBuilder()
    .setName('save-me')
    .setDescription('Save your game data to DynamoDB (test command).'),

  // 🧹 /delete-me
  new SlashCommandBuilder()
    .setName('delete-me')
    .setDescription('Delete all stored game data for your account.')
].map((cmd) => cmd.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Refreshing guild slash commands...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands
    });
    console.log(`✅ Commands registered for guild: ${GUILD_ID}`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
