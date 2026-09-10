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

    return user.role === "ADMIN";
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
                        "❌ Удалить партнёра",
                        "admin:partners:remove",
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


            if (
                result.length === 0
            ) {
                await ctx.reply(
                    "👥 Партнёров пока нет.",
                );

                return;
            }


            let message =
                `📋 Партнёры

Всего: ${result.length}

`;


            for (
                const partner
                of result
            ) {
                message +=
                    `#${partner.id} — ${partner.name}
Affiliate ID: ${partner.affiliateId}
Статус: ${
    partner.isActive
        ? "✅ Active"
        : "❌ Disabled"
}

`;
            }


            await ctx.reply(
                message,
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