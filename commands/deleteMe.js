// /delete-me command — Orchid Hunter DEV bot
// This command will (eventually) delete all stored data for the user.
// For now, it just confirms what it would do.

module.exports = {
  data: {
    name: 'delete-me',
    description: 'Delete all game data associated with your account.'
  },

  async execute(interaction) {
    const userId = interaction.user.id;

    // TODO: add DynamoDB + S3 cleanup once storage layer is ready.
    // Example: await deleteUserData(userId);

    await interaction.reply({
      content:
        `🧹 All your Orchid Hunter data (user ID: \`${userId}\`) ` +
        `would be permanently deleted. (Stub in dev mode)`,
      ephemeral: true
    });
  }
};
