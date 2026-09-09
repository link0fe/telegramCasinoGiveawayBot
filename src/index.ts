import { createBot } from "./app/bot.js";

const bot = createBot();

console.log("🤖 Starting bot...");

bot.start({
    onStart: (botInfo) => {
        console.log(`✅ Bot @${botInfo.username} started`);
    },
});