require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Import commands
const pingCommand = require('./commands/ping.js');
const deleteMeCommand = require('./commands/deleteMe.js');
const saveMeCommand = require('./commands/saveMe.js');
const viewMeCommand = require('./commands/viewMe.js');
const linkWalletCommand = require('./commands/linkWallet.js');
const verifyWalletCommand = require('./commands/verifyWallet.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    if (commandName === pingCommand.data.name) {
      await pingCommand.execute(interaction);
    } else if (commandName === verifyWalletCommand.data.name) {
      await verifyWalletCommand.execute(interaction);
    } else if (commandName === deleteMeCommand.data.name) {
      await deleteMeCommand.execute(interaction);
    } else if (commandName === saveMeCommand.data.name) {
      await saveMeCommand.execute(interaction);
    } else if (commandName === viewMeCommand.data.name) {
      await viewMeCommand.execute(interaction);
    } else if (commandName === linkWalletCommand.data.name) {
      await linkWalletCommand.execute(interaction);
    }
  } catch (err) {
    console.error('❌ Command error:', err);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'Something went wrong!',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'Something went wrong!',
        ephemeral: true
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
