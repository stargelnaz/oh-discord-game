require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  UpdateCommand
} = require('@aws-sdk/lib-dynamodb');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const ddb = DynamoDBDocumentClient.from(client);

app.post('/api/verify-wallet', async (req, res) => {
  try {
    const { discordId, walletId, code } = req.body;
    if (!discordId || !walletId || !code) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    await ddb.send(
      new UpdateCommand({
        TableName: 'DiscordUsers',
        Key: { userId: discordId },
        UpdateExpression:
          'SET walletId = :wallet, verifiedAt = :now REMOVE pendingWallet, verificationCode, verificationExpires',
        ExpressionAttributeValues: {
          ':wallet': walletId,
          ':now': new Date().toISOString()
        }
      })
    );

    console.log(`✅ Verified ${walletId} for Discord user ${discordId}`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error verifying wallet:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
