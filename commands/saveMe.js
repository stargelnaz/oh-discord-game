// /save-me command — Orchid Hunter DEV bot
// This command creates or updates the user's record in DynamoDB and logs each step.

require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('save-me')
    .setDescription('Save your game data to DynamoDB (test command).'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const username = interaction.user.username;

    try {
      console.log('🧠 /save-me triggered by:', username, userId);

      const item = {
        userId,
        username,
        savedAt: new Date().toISOString(),
        note: 'Test record for Orchid Hunter dev environment'
      };

      console.log('🧩 Attempting DynamoDB PutCommand:', item);

      const response = await ddb.send(
        new PutCommand({
          TableName: 'DiscordUsers',
          Item: item
        })
      );

      console.log('✅ DynamoDB PutCommand response:', response);

      await interaction.reply({
        content: `💾 User data for **${username}** has been saved successfully.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('❌ DynamoDB save error:', err);

      try {
        await interaction.reply({
          content:
            '⚠️ Something went wrong while saving your data. Please try again later.',
          ephemeral: true
        });
      } catch (nestedErr) {
        console.error('⚠️ Could not send Discord reply:', nestedErr);
      }
    }
  }
};
