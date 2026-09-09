import type { Bot } from "grammy";
import type { BotContext } from "../session/bot-session.js";
import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";
import { UserService } from "../../modules/users/user.service.js";
import {
    createPlayerKeyboard,
    createPartnerKeyboard,
    createAdminKeyboard,
} from "../keyboards/main.keyboards";


const userService = new UserService();
const giveawayService = new GiveawayService();

export function registerStartCommand(bot: Bot<BotContext>) {
    bot.command("start", async (ctx) => {

        const telegramUser = ctx.from;

        if (!telegramUser) {
            return;
        }


        const user =
            await userService.getOrCreateTelegramUser({
                telegramId:
                    String(telegramUser.id),

                username:
                    telegramUser.username,

                firstName:
                    telegramUser.first_name,
            });

        const startPayload = ctx.match?.trim();
        if (startPayload && startPayload.startsWith("g_")) {
            const giveawayId = Number(startPayload.slice(2),);
            if (!Number.isInteger( giveawayId,)) {
                await ctx.reply(
                    "❌ Некорректная ссылка на розыгрыш.",
                );
                return;
            }
            const giveaway = await giveawayService.getGiveawayById(giveawayId);
            if (!giveaway) {
                await ctx.reply(
                    "❌ Розыгрыш не найден.",
                );
                return;
            }

            if (giveaway.status !=="ACTIVE") {
                await ctx.reply(
                    "❌ Этот розыгрыш уже недоступен.",
                );
                return;
            }

            if (giveaway.endsAt.getTime() <= Date.now()) {
                await ctx.reply(
                    "⏰ Розыгрыш уже завершён.",
                );
                return;
            }
            await ctx.reply(`🎁 ${giveaway.title}
            🏆 Победителей: ${giveaway.winnersCount}
            Для участия следующим шагом нужно будет отправить Player ID.`,);
            return;
        }

        let keyboard;

        switch (user.role) {

            case "ADMIN":
                keyboard = createAdminKeyboard();
                break;

            case "PARTNER":
                keyboard = createPartnerKeyboard();
                break;

            default:
                keyboard = createPlayerKeyboard();
        }


        await ctx.reply(
            `👋 Привет, ${telegramUser.first_name}!`,
            {
                reply_markup: keyboard,
            },
        );
        console.log("ctx.match =", ctx.match);
        console.log("message text =", ctx.message?.text);
    });
}