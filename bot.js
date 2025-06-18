const mineflayer = require('mineflayer');
const fs = require('fs');

const config = require('./config.json');
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: "1.19.2"
});

const PASSWORD = "ai_bot22";

bot.on('login', () => {
  console.log('Bot logged in.');
});

// Handle registration/login for LoginSecurity
bot.on('message', (message) => {
  const msg = message.toString().toLowerCase();

  if (msg.includes('/register') || msg.includes('register')) {
    bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
    console.log('Sent register command.');
  } else if (msg.includes('/login') || msg.includes('login')) {
    bot.chat(`/login ${PASSWORD}`);
    console.log('Sent login command.');
  }
});

// Handle player chat
bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  fs.writeFileSync('bridge.json', JSON.stringify({ username, message }));

  setTimeout(() => {
    try {
      const reply = fs.readFileSync('bridge.json', 'utf-8');
      const data = JSON.parse(reply);
      if (data.reply) {
        bot.chat(data.reply);
      }
    } catch (err) {
      console.error("No reply from AI.");
    }
  }, 3000);
});
