import { Bot, session } from "grammy";
import { env } from "../config/env.js";
import { registerStartCommand } from "../telegram/commands/start.command.js";
import { registerAddPartnerCommand } from "../telegram/commands/add-partner.command.js";
import { registerGiveawayWizard } from "../telegram/commands/giveaway-wizard.command.js";
import { registerJoinGiveawayCommand } from "../telegram/commands/join-giveaway.command.js";
import type { BotContext, BotSession } from "../telegram/session/bot-session.js";
import { startGiveawayScheduler } from "./schedulers/giveaway.scheduler.js";
import { registerCasinoDataCommand } from "../telegram/commands/casino-data.command.js";
import { registerAdminPartnersCommand } from "../telegram/commands/admin-partners.command.js";


export function createBot() {
    const bot = new Bot<BotContext>(
        env.BOT_TOKEN,
    );

    bot.use(
        session({
            initial(): BotSession {
                return {};
            },
        }),
    );

    registerStartCommand(bot);
    registerAddPartnerCommand(bot);
    registerGiveawayWizard(bot);
    registerJoinGiveawayCommand(bot);
    registerCasinoDataCommand(bot);
    registerAdminPartnersCommand(bot);

    bot.callbackQuery(
        "profile",
        async (ctx) => {
            await ctx.answerCallbackQuery();

            await ctx.reply(
                `👤 Telegram ID: ${ctx.from.id}`,
            );
        },
    );


    bot.catch((error) => {
        console.error(
            "Telegram bot error:",
            error,
        );
    });

    startGiveawayScheduler(bot);

    return bot;
}