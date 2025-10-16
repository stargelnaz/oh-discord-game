// /verify-wallet command — Orchid Hunter DEV bot
// Step 1: Accepts the user's signed verification code
// Step 2: Uses eosjs to confirm that the signature matches the pending wallet
// Step 3: Updates DynamoDB record to mark the wallet as verified

require('dotenv').config();
const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const ecc = require('eosjs-ecc');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

// Public WAX chain endpoint (you can switch to another API provider if needed)
const WAX_RPC_ENDPOINT = 'https://api.wax.greymass.com';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify-wallet')
    .setDescription('Verify ownership of your Wax wallet by signing your code.')
    .addStringOption((option) =>
      option
        .setName('signature')
        .setDescription('Your signed verification code')
        .setRequired(true)
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const signature = interaction.options.getString('signature').trim();

    try {
      // Retrieve pending verification data
      const { Item } = await ddb.send(
        new GetCommand({
          TableName: 'DiscordUsers',
          Key: { userId }
        })
      );

      if (!Item || !Item.pendingWallet || !Item.verificationCode) {
        await interaction.reply({
          content:
            '❌ No pending wallet verification found. Run `/link-wallet` first.',
          flags: 64
        });
        return;
      }

      const { pendingWallet, verificationCode, verificationExpires } = Item;

      if (Date.now() > verificationExpires) {
        await interaction.reply({
          content:
            '⏰ Verification code expired. Please run `/link-wallet` again.',
          flags: 64
        });
        return;
      }

      // --- Verify signature ---
      // Get the public key from the signature
      let publicKey;
      try {
        publicKey = ecc.recover(verificationCode, signature);
        console.log('Recovered public key:', publicKey);
      } catch (sigErr) {
        console.error('Signature recovery failed:', sigErr);
        await interaction.reply({
          content: '❌ Invalid signature. Please check and try again.',
          flags: 64
        });
        return;
      }

      // --- Check if the recovered key belongs to the claimed wallet ---
      const rpcResponse = await fetch(
        `${WAX_RPC_ENDPOINT}/v1/chain/get_account`,
        {
          method: 'POST',
          body: JSON.stringify({ account_name: pendingWallet })
        }
      );
      const accountData = await rpcResponse.json();

      const keys = accountData?.permissions?.flatMap((p) =>
        p.required_auth.keys.map((k) => k.key)
      );

      if (!keys || !keys.includes(publicKey)) {
        await interaction.reply({
          content: '🚫 The signature does not match your claimed wallet.',
          flags: 64
        });
        return;
      }

      // --- Success: update verified wallet in DynamoDB ---
      await ddb.send(
        new UpdateCommand({
          TableName: 'DiscordUsers',
          Key: { userId },
          UpdateExpression:
            'SET walletId = :wallet, verifiedAt = :now REMOVE pendingWallet, verificationCode, verificationExpires',
          ExpressionAttributeValues: {
            ':wallet': pendingWallet,
            ':now': new Date().toISOString()
          }
        })
      );

      await interaction.reply({
        content: `✅ Wallet **${pendingWallet}** successfully verified and linked to your account.`,
        flags: 64
      });

      console.log(`✅ Verified wallet ${pendingWallet} for user ${userId}`);
    } catch (err) {
      console.error('❌ Error verifying wallet:', err);
      await interaction.reply({
        content:
          '⚠️ Something went wrong while verifying your wallet. Try again later.',
        flags: 64
      });
    }
  }
};
