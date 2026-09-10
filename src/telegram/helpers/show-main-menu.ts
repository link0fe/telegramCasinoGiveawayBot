import type {
    BotContext,
} from "../session/bot-session.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import {
    createPlayerKeyboard,
    createPartnerKeyboard,
    createAdminKeyboard,
} from "../keyboards/main.keyboards.js";


const userService =
    new UserService();


export async function showMainMenu(
    ctx: BotContext,
) {
    if (!ctx.from) {
        return;
    }

    const user =
        await userService
            .getOrCreateTelegramUser({
                telegramId:
                    String(ctx.from.id),

                username:
                    ctx.from.username,

                firstName:
                    ctx.from.first_name,
            });


    if (user.role === "ADMIN") {
        await ctx.reply(
            "🏠 Главное меню",
            {
                reply_markup:
                    createAdminKeyboard(),
            },
        );

        return;
    }


    if (user.role === "PARTNER") {
        await ctx.reply(
            "🏠 Главное меню",
            {
                reply_markup:
                    createPartnerKeyboard(),
            },
        );

        return;
    }


    await ctx.reply(
        "🏠 Главное меню",
        {
            reply_markup:
                createPlayerKeyboard(),
        },
    );
}