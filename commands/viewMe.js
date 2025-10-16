// /view-me command — shows current saved record
require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('view-me')
    .setDescription('View your saved data from DynamoDB.'),
  async execute(interaction) {
    const userId = interaction.user.id;
    try {
      const result = await ddb.send(
        new GetCommand({ TableName: 'DiscordUsers', Key: { userId } })
      );

      if (!result.Item) {
        await interaction.reply({ content: 'No record found.', flags: 64 });
        return;
      }

      await interaction.reply({
        content:
          `🧾 **Your record:**\n` +
          `Username: ${result.Item.username}\n` +
          `Saved At: ${result.Item.savedAt}\n` +
          `Note: ${result.Item.note}`,
        flags: 64
      });
    } catch (err) {
      console.error('❌ DynamoDB get error:', err);
      await interaction.reply({
        content: '⚠️ Error retrieving data.',
        flags: 64
      });
    }
  }
};
