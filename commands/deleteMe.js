// /delete-me command — Orchid Hunter DEV bot
// This command deletes all stored user data from DynamoDB (and later, S3).

require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  DeleteCommand
} = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-me')
    .setDescription('Delete all game data associated with your account.'),

  async execute(interaction) {
    const userId = interaction.user.id;

    try {
      // Attempt to delete the user's record from the DynamoDB table
      await ddb.send(
        new DeleteCommand({
          TableName: 'DiscordUsers',
          Key: { userId }
        })
      );

      await interaction.reply({
        content: `🧹 Your Orchid Hunter data (user ID: \`${userId}\`) has been permanently deleted.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ DynamoDB delete error:', err);

      await interaction.reply({
        content:
          '⚠️ Something went wrong while trying to delete your data. Please try again later.',
        ephemeral: true
      });
    }
  }
};
