const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const autoeat = require('mineflayer-auto-eat').default;
const mcDataLoader = require('minecraft-data');
const config = require('./config.json');
const fs = require('fs');

const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: config.version || false
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(autoeat);

let mcData;
let defaultMove;
let isNight = false;
let patrolInterval;
let roamInterval;

bot.once('spawn', () => {
  mcData = mcDataLoader(bot.version);
  defaultMove = new Movements(bot, mcData);

  // Auto register/login
  bot.chat('/register ai_bot22 ai_bot22');
  bot.chat('/login ai_bot22');

  // Auto eat settings
  bot.autoEat.options = {
    priority: 'foodPoints',
    startAt: 19,
    bannedFood: []
  };

  bot.on('health', () => {
    if (bot.food < 20) {
      bot.autoEat.enable();
    } else {
      bot.autoEat.disable();
    }
  });

  startDayNightCycle();
});

// Detect day/night cycle
function startDayNightCycle() {
  setInterval(() => {
    isNight = bot.time.timeOfDay >= 13000 && bot.time.timeOfDay <= 23000;
    if (isNight) {
      startPatrolling();
      stopRoaming();
    } else {
      stopPatrolling();
      startRoaming();
    }
  }, 5000);
}

// PATROLLING (attack hostile mobs at night)
function startPatrolling() {
  if (patrolInterval) return;
  patrolInterval = setInterval(() => {
    const mob = bot.nearestEntity(e =>
      e.type === 'mob' &&
      ['zombie', 'skeleton', 'spider'].includes(e.name)
    );
    const creeper = bot.nearestEntity(e => e.name === 'creeper');

    if (creeper) {
      avoidCreeper(creeper);
    } else if (mob) {
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new goals.GoalFollow(mob, 1));
      bot.attack(mob);
    }
  }, 3000);
}

function stopPatrolling() {
  if (patrolInterval) {
    clearInterval(patrolInterval);
    patrolInterval = null;
  }
}

// CREEPER AVOIDANCE
function avoidCreeper(creeper) {
  const pos = creeper.position.offset(15, 0, 15);
  bot.pathfinder.setMovements(defaultMove);
  bot.pathfinder.setGoal(new goals.GoalNear(pos.x, pos.y, pos.z, 1));

  // Shoot if has bow
  const bow = bot.inventory.items().find(item => item.name.includes('bow'));
  if (bow) {
    bot.equip(bow, 'hand', () => {
      bot.lookAt(creeper.position.offset(0, 1.6, 0));
      bot.activateItem(); // Start drawing
      setTimeout(() => bot.deactivateItem(), 500); // Release arrow
    });
  }
}

// ROAM FREELY IN DAY
function startRoaming() {
  if (roamInterval) return;
  roamInterval = setInterval(() => {
    const x = bot.entity.position.x + (Math.random() * 20 - 10);
    const z = bot.entity.position.z + (Math.random() * 20 - 10);
    const y = bot.entity.position.y;
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
  }, 10000);
}

function stopRoaming() {
  if (roamInterval) {
    clearInterval(roamInterval);
    roamInterval = null;
  }
}

// CHAT: connect to Python AI
const bridgeFile = './bridge.json';
fs.writeFileSync(bridgeFile, JSON.stringify({ message: '', username: '', reply: '' }));

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  fs.writeFileSync(bridgeFile, JSON.stringify({ message, username, reply: '' }));

  const checkReply = setInterval(() => {
    try {
      const data = JSON.parse(fs.readFileSync(bridgeFile));
      if (data.reply) {
        bot.chat(data.reply);
        clearInterval(checkReply);
      }
    } catch {}
  }, 2000);
});
