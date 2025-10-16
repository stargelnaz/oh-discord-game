// /link-wallet command — Orchid Hunter DEV bot
// Step 1: Generates a verification code for the provided Wax wallet
// Step 2: Stores pending verification in DynamoDB
// Step 3: Instructs user to sign the code and verify with /verify-wallet

require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link-wallet')
    .setDescription('Link your Wax wallet to your Discord account.')
    .addStringOption((option) =>
      option
        .setName('wallet')
        .setDescription('Your Wax wallet ID (e.g. abcd1.wam)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const walletId = interaction.options.getString('wallet').trim();

    try {
      // Generate random verification code (6-hex)
      const verificationCode = crypto
        .randomBytes(3)
        .toString('hex')
        .toUpperCase();
      const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

      console.log(`🔗 Generating verification for ${userId} → ${walletId}`);

      // Store pending verification in DynamoDB
      await ddb.send(
        new UpdateCommand({
          TableName: 'DiscordUsers',
          Key: { userId },
          UpdateExpression:
            'SET pendingWallet = :wallet, verificationCode = :code, verificationExpires = :exp REMOVE walletId, verifiedAt',
          ExpressionAttributeValues: {
            ':wallet': walletId,
            ':code': verificationCode,
            ':exp': expiresAt
          }
        })
      );

      // Send user instructions
      await interaction.reply({
        content:
          `🪙 **Wallet linking started!**\n` +
          `Your wallet: \`${walletId}\`\n` +
          `Verification code: \`${verificationCode}\`\n\n` +
          `Please **sign this code** using your Wax wallet (via your preferred wallet app or signing tool).\n` +
          `Then run: \`/verify-wallet signature:<your_signed_message>\`.\n\n` +
          `This code will expire in **5 minutes**.`,
        flags: 64 // ephemeral
      });
    } catch (err) {
      console.error('❌ Error during /link-wallet:', err);
      await interaction.reply({
        content:
          '⚠️ Something went wrong while creating your verification request.',
        flags: 64
      });
    }
  }
};
