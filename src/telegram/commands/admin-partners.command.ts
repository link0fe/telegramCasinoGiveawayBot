import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    showMainMenu,
} from "../helpers/show-main-menu.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import {
    PartnerService,
} from "../../modules/partners/partner.service.js";

import {
    db,
} from "../../database/db.js";

import {
    partners,
} from "../../database/schema.js";


const userService =
    new UserService();

const partnerService =
    new PartnerService();


async function isAdmin(
    ctx: BotContext,
) {
    if (!ctx.from) {
        return false;
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

    return user?.role ===
        "ADMIN";
}


/*
 * Карточка партнёра.
 *
 * Используем одну функцию,
 * чтобы после activate/deactivate
 * просто перерисовывать то же сообщение.
 */
async function showPartnerCard(
    ctx: BotContext,
    partnerId: number,
) {
    const result =
        await db
            .select()
            .from(partners);

    const partner =
        result.find(
            (item) =>
                item.id ===
                partnerId,
        );


    if (!partner) {
        await ctx.reply(
            "❌ Партнёр не найден.",
        );

        return;
    }


    const keyboard =
        new InlineKeyboard();


    if (partner.isActive) {
        keyboard.text(
            "⛔ Отключить",
            `admin:partner:disable:${partner.id}`,
        );
    } else {
        keyboard.text(
            "♻️ Активировать",
            `admin:partner:enable:${partner.id}`,
        );
    }


    keyboard
        .row()
        .text(
            "⬅️ К списку",
            "admin:partners:list",
        );


    const message =
        `👤 ${partner.name}

Affiliate ID: ${partner.affiliateId}

Статус: ${
    partner.isActive
        ? "✅ Активен"
        : "❌ Отключён"
}`;


    /*
     * Если карточка открыта через callback,
     * редактируем существующее сообщение.
     */
    if (
        ctx.callbackQuery
            ?.message
    ) {
        await ctx.editMessageText(
            message,
            {
                reply_markup:
                    keyboard,
            },
        );

        return;
    }


    await ctx.reply(
        message,
        {
            reply_markup:
                keyboard,
        },
    );
}


export function registerAdminPartnersCommand(
    bot: Bot<BotContext>,
) {

    /*
     * =========================
     * ГЛАВНОЕ МЕНЮ ПАРТНЁРОВ
     * =========================
     */
    bot.callbackQuery(
        "admin:partners",
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            /*
             * Если раньше был запущен
             * partner workflow —
             * закрываем его.
             */
            delete ctx.session
                .partnerAdmin;


            const keyboard =
                new InlineKeyboard()
                    .text(
                        "📋 Список партнёров",
                        "admin:partners:list",
                    )
                    .row()
                    .text(
                        "➕ Добавить партнёра",
                        "admin:partners:add",
                    )
                    .row()
                    .text(
                        "⬅️ Назад",
                        "admin:partners:back",
                    );


            await ctx.reply(
                "👥 Управление партнёрами",
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    /*
     * =========================
     * СПИСОК ПАРТНЁРОВ
     * =========================
     */
    bot.callbackQuery(
        "admin:partners:list",
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }


            const result =
                await db
                    .select()
                    .from(partners);


            const keyboard =
                new InlineKeyboard();


            if (
                result.length === 0
            ) {
                keyboard.text(
                    "⬅️ Назад",
                    "admin:partners",
                );


                await ctx
                    .editMessageText(
                        "👥 Партнёров пока нет.",
                        {
                            reply_markup:
                                keyboard,
                        },
                    );

                return;
            }


            for (
                const partner
                of result
            ) {
                keyboard
                    .text(
                        `${
                            partner.isActive
                                ? "🟢"
                                : "🔴"
                        } ${partner.name}`,
                        `admin:partner:${partner.id}`,
                    )
                    .row();
            }


            keyboard.text(
                "⬅️ Назад",
                "admin:partners",
            );


            await ctx
                .editMessageText(
                    `📋 Партнёры

Всего: ${result.length}

Выберите партнёра:`,
                    {
                        reply_markup:
                            keyboard,
                    },
                );
        },
    );


    /*
     * =========================
     * КАРТОЧКА ПАРТНЁРА
     * =========================
     */
    bot.callbackQuery(
        /^admin:partner:(\d+)$/,
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }


            const partnerId =
                Number(
                    ctx.match[1],
                );


            if (
                !Number.isInteger(
                    partnerId,
                )
            ) {
                await ctx.reply(
                    "❌ Некорректный ID партнёра.",
                );

                return;
            }


            await showPartnerCard(
                ctx,
                partnerId,
            );
        },
    );


    /*
     * =========================
     * ОТКЛЮЧИТЬ ПАРТНЁРА
     * =========================
     */
    bot.callbackQuery(
        /^admin:partner:disable:(\d+)$/,
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }


            const partnerId =
                Number(
                    ctx.match[1],
                );


            if (
                !Number.isInteger(
                    partnerId,
                )
            ) {
                await ctx.reply(
                    "❌ Некорректный ID партнёра.",
                );

                return;
            }


            try {
                await partnerService
                    .deactivatePartner(
                        partnerId,
                    );


                /*
                 * Никакого нового сообщения.
                 *
                 * Перерисовываем текущую
                 * карточку партнёра.
                 */
                await showPartnerCard(
                    ctx,
                    partnerId,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);


                if (
                    message ===
                    "PARTNER_NOT_FOUND"
                ) {
                    await ctx.reply(
                        "❌ Партнёр не найден.",
                    );

                    return;
                }


                if (
                    message ===
                    "PARTNER_ALREADY_INACTIVE"
                ) {
                    /*
                     * Просто обновим карточку,
                     * если состояние уже изменилось.
                     */
                    await showPartnerCard(
                        ctx,
                        partnerId,
                    );

                    return;
                }


                console.error(
                    "Deactivate partner error:",
                    error,
                );


                await ctx.reply(
                    "❌ Не удалось отключить партнёра.",
                );
            }
        },
    );


    /*
     * =========================
     * АКТИВИРОВАТЬ ПАРТНЁРА
     * =========================
     */
    bot.callbackQuery(
        /^admin:partner:enable:(\d+)$/,
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }


            const partnerId =
                Number(
                    ctx.match[1],
                );


            if (
                !Number.isInteger(
                    partnerId,
                )
            ) {
                await ctx.reply(
                    "❌ Некорректный ID партнёра.",
                );

                return;
            }


            try {
                await partnerService
                    .activatePartner(
                        partnerId,
                    );


                /*
                 * После активации
                 * редактируем ту же карточку.
                 */
                await showPartnerCard(
                    ctx,
                    partnerId,
                );
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : String(error);


                if (
                    message ===
                    "PARTNER_NOT_FOUND"
                ) {
                    await ctx.reply(
                        "❌ Партнёр не найден.",
                    );

                    return;
                }


                if (
                    message ===
                    "PARTNER_ALREADY_ACTIVE"
                ) {
                    await showPartnerCard(
                        ctx,
                        partnerId,
                    );

                    return;
                }


                console.error(
                    "Activate partner error:",
                    error,
                );


                await ctx.reply(
                    "❌ Не удалось активировать партнёра.",
                );
            }
        },
    );


    /*
     * =========================
     * ДОБАВИТЬ ПАРТНЁРА
     * =========================
     */
    bot.callbackQuery(
        "admin:partners:add",
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }


            /*
             * Не позволяем двум wizard
             * одновременно ждать message:text.
             */
            delete ctx.session
                .giveawayWizard;


            ctx.session.partnerAdmin = {
                step:
                    "WAITING_ADD_DATA",
            };


            await ctx.reply(
                `➕ Добавление партнёра

Отправь данные в формате:

TelegramID AffiliateID Имя

Например:

123456789 88369 Vitaliy

Для отмены:
/cancel`,
            );
        },
    );


    /*
     * =========================
     * MESSAGE HANDLER
     * =========================
     *
     * Теперь он нужен только
     * для добавления партнёра.
     */
    bot.on(
        "message:text",
        async (ctx, next) => {

            const state =
                ctx.session
                    .partnerAdmin;


            if (!state) {
                await next();

                return;
            }


            const text =
                ctx.message.text
                    .trim();


            /*
             * Отмена.
             */
            if (
                text === "/cancel"
            ) {
                delete ctx.session
                    .partnerAdmin;


                await ctx.reply(
                    "❌ Действие отменено.",
                );


                await showMainMenu(
                    ctx,
                );

                return;
            }


            /*
             * Добавление партнёра.
             */
            if (
                state.step ===
                "WAITING_ADD_DATA"
            ) {
                const parts =
                    text.split(
                        /\s+/,
                    );


                if (
                    parts.length < 3
                ) {
                    await ctx.reply(
                        `❌ Неверный формат.

Нужно:

TelegramID AffiliateID Имя`,
                    );

                    return;
                }


                const telegramId =
                    parts[0];

                const affiliateId =
                    parts[1];

                const name =
                    parts
                        .slice(2)
                        .join(" ");


                if (
                    !telegramId ||
                    !affiliateId
                ) {
                    await ctx.reply(
                        `❌ Неверный формат.

Используй:

TelegramID AffiliateID Название`,
                    );

                    return;
                }


                try {
                    await partnerService
                        .createPartner({
                            telegramId,
                            affiliateId,
                            name,
                        });


                    delete ctx.session
                        .partnerAdmin;


                    await ctx.reply(
                        `✅ Партнёр добавлен

👤 ${name}
Affiliate ID: ${affiliateId}`,
                    );


                    await showMainMenu(
                        ctx,
                    );
                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : String(error);


                    console.error(
                        "Create partner error:",
                        error,
                    );


                    await ctx.reply(
                        `❌ Не удалось добавить партнёра

${message}`,
                    );
                }


                return;
            }


            await next();
        },
    );


    /*
     * =========================
     * НАЗАД
     * =========================
     */
    bot.callbackQuery(
        "admin:partners:back",
        async (ctx) => {
            await ctx
                .answerCallbackQuery();


            delete ctx.session
                .partnerAdmin;


            await showMainMenu(
                ctx,
            );
        },
    );
}