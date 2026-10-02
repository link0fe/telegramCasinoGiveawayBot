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

import {
    emoji,
} from "../ui/emojis.js";


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
                    String(
                        ctx.from.id,
                    ),

                username:
                    ctx.from.username,

                firstName:
                    ctx.from.first_name,
            });


    if (!user) {
        await ctx.reply(
            "❌ Не удалось загрузить пользователя.",
        );

        return;
    }


    let keyboard;


    switch (user.role) {
        case "ADMIN":
            keyboard =
                createAdminKeyboard();
            break;

        case "PARTNER":
            keyboard =
                createPartnerKeyboard();
            break;

        default:
            keyboard =
                createPlayerKeyboard();
    }


    const text =
        `${emoji("star")} <b>CASINO GIVEAWAY</b>

${emoji("slots")} Главное меню
`;


    /*
     * Если мы пришли сюда после нажатия
     * inline-кнопки — редактируем существующее
     * сообщение вместо создания нового.
     */
    if (
        ctx.callbackQuery?.message
    ) {
        try {
            await ctx.editMessageText(
                text,
                {
                    parse_mode:
                        "HTML",

                    reply_markup:
                        keyboard,
                },
            );

            return;
        } catch (error) {
            /*
             * Например Telegram может вернуть
             * "message is not modified".
             *
             * В таком случае fallback ниже.
             */
            console.warn(
                "Could not edit main menu message:",
                error,
            );
        }
    }


    /*
     * /start, /cancel и другие случаи,
     * где нечего редактировать.
     */
    await ctx.reply(
        text,
        {
            parse_mode:
                "HTML",

            reply_markup:
                keyboard,
        },
    );
}