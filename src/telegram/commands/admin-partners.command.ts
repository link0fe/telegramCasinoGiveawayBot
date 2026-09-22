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
    db,
} from "../../database/db.js";

import {
    partners,
} from "../../database/schema.js";


const userService =
    new UserService();


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
                    String(ctx.from.id),

                username:
                    ctx.from.username,

                firstName:
                    ctx.from.first_name,
            });

    return user?.role === "ADMIN";
}


export function registerAdminPartnersCommand(
    bot: Bot<BotContext>,
) {

    bot.callbackQuery(
        "admin:partners",
        async (ctx) => {

            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


        const keyboard = new InlineKeyboard()
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
                "⛔ Отключить партнёра",
                "admin:partners:remove",
            )
            .row()
            .text(
                "♻️ Активировать партнёра",
                "admin:partners:activate",
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


    bot.callbackQuery(
        "admin:partners:list",
        async (ctx) => {
            await ctx.answerCallbackQuery();

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

                await ctx.editMessageText(
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

            await ctx.editMessageText(
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
    
    bot.callbackQuery(
        /^admin:partner:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            const partnerId =
                Number(ctx.match[1]);

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

            await ctx.editMessageText(
                `👤 ${partner.name}

    Affiliate ID: ${partner.affiliateId}

    Статус: ${
        partner.isActive
            ? "✅ Активен"
            : "❌ Отключён"
    }`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    bot.callbackQuery(
        "admin:partners:back",
        async (ctx) => {

            await ctx.answerCallbackQuery();

            await showMainMenu(ctx);
        },
    );

    bot.callbackQuery(
    "admin:partners:add",
    async (ctx) => {

        await ctx.answerCallbackQuery();

        if (
            !(await isAdmin(ctx))
        ) {
            return;
        }

        ctx.session.partnerAdmin = {
            step: "WAITING_ADD_DATA",
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

    bot.callbackQuery("admin:partners:activate",
        async (ctx) => {
            await ctx
                .answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            ctx.session.partnerAdmin = {
                step:
                    "WAITING_ACTIVATE_ID",
            };

            await ctx.reply(
                `♻️ Активация партнёра

    Отправь ID партнёра.

    Например:

    2

    Для отмены:
    /cancel`,
            );
        },
    );

    bot.on(
        "message:text",
        async (ctx, next) => {

            const state =
                ctx.session.partnerAdmin;

            if (!state) {
                await next();
                return;
            }

            const text =
                ctx.message.text.trim();


            // Общая отмена
            if (text === "/cancel") {
                delete ctx.session
                    .partnerAdmin;

                await ctx.reply(
                    "❌ Действие отменено.",
                );

                await showMainMenu(ctx);

                return;
            }


            // =========================
            // ДОБАВЛЕНИЕ ПАРТНЁРА
            // =========================

            if (
                state.step ===
                    "WAITING_ADD_DATA"
            ) {
                const parts =
                    text.split(/\s+/);

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

                try {
                    const {
                        PartnerService,
                    } =
                        await import(
                            "../../modules/partners/partner.service.js"
                        );

                    const partnerService =
                        new PartnerService();

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

                    await showMainMenu(ctx);

                } catch (error) {
                    const message =
                        error instanceof Error
                            ? error.message
                            : String(error);

                    await ctx.reply(
                        `❌ Не удалось добавить партнёра

    ${message}`,
                    );
                }

                return;
            }


            // =========================
            // УДАЛЕНИЕ / ДЕАКТИВАЦИЯ
            // =========================

            if (
                state.step ===
                    "WAITING_REMOVE_ID"
            ) {
                const partnerId =
                    Number(text);

                if (
                    !Number.isInteger(
                        partnerId,
                    )
                ) {
                    await ctx.reply(
                        "❌ ID партнёра должен быть числом.",
                    );

                    return;
                }

                try {
                    const {
                        PartnerService,
                    } =
                        await import(
                            "../../modules/partners/partner.service.js"
                        );

                    const partnerService =
                        new PartnerService();

                    await partnerService
                        .deactivatePartner(
                            partnerId,
                        );

                    delete ctx.session
                        .partnerAdmin;

                    await ctx.reply(
                        `✅ Партнёр #${partnerId} отключён.`,
                    );

                    await showMainMenu(ctx);

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
                        await ctx.reply(
                            "⚠️ Этот партнёр уже отключён.",
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
                return;
            }

            // =========================
            // АКТИВАЦИЯ ПАРТНЁРА
            // =========================

        if (
            state.step ===
                "WAITING_ACTIVATE_ID"
        ) {
            const partnerId =
                Number(text);

            if (
                !Number.isInteger(
                    partnerId,
                )
            ) {
                await ctx.reply(
                    "❌ ID партнёра должен быть числом.",
                );

                return;
            }

            try {
                const {
                    PartnerService,
                } =
                    await import(
                        "../../modules/partners/partner.service.js"
                    );

                const partnerService =
                    new PartnerService();

                const partner =
                    await partnerService
                        .activatePartner(
                            partnerId,
                        );

                delete ctx.session
                    .partnerAdmin;

                await ctx.reply(
                    `✅ Партнёр активирован

        👤 ${partner.name}
        Affiliate ID: ${partner.affiliateId}`,
                );

                await showMainMenu(ctx);

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
                    await ctx.reply(
                        "⚠️ Этот партнёр уже активен.",
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

            return;
        }


            await next();
        },
    );
    bot.callbackQuery( "admin:partners:remove",
        async (ctx) => {

            await ctx.answerCallbackQuery();

            if (
                !(await isAdmin(ctx))
            ) {
                return;
            }

            ctx.session.partnerAdmin = {
                step: "WAITING_REMOVE_ID",
            };

            await ctx.reply(
                `❌ Удаление партнёра

    Отправь ID партнёра.

    Например:

    2

    Для отмены:
    /cancel`,
            );
        },
    );
    
}