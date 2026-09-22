import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
    InlineKeyboard,
} from "grammy";
import type {
    Bot,
} from "grammy";
import type {
    BotContext,
} from "../session/bot-session.js";
import {
    UserService,
} from "../../modules/users/user.service.js";
import {
    CasinoImportAuditService,
} from "../../modules/casino/casino-import-audit.service.js";
import {
    env,
} from "../../config/env.js";
import { showMainMenu } from "../helpers/show-main-menu.js";
import {
    CasinoImportRepository,
} from "../../modules/casino/casino-import.repository.js";


const userService =
    new UserService();

const importService =
    new CasinoImportAuditService();

const importRepository =
    new CasinoImportRepository();


async function isAdmin(
    ctx: BotContext,
) {
    if (!ctx.from) {
        return false;
    }

    const user =
        await userService.getOrCreateTelegramUser({
            telegramId:
                String(ctx.from.id),

            username:
                ctx.from.username,

            firstName:
                ctx.from.first_name,
        });

    return user?.role === "ADMIN";
}


export function registerCasinoDataCommand(
    bot: Bot<BotContext>,
) {

    /*
     * Кнопка из ADMIN меню.
     *
     * В keyboard callback_data должен быть:
     * admin:casino-data
     */
    bot.callbackQuery(
        "admin:casino-data",
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
                        "📤 Загрузить CSV",
                        "admin:casino-upload",
                    )
                    .row()
                    .text(
                        "📜 История импортов",
                        "admin:casino-imports",
                    )
                    .row()
                    .text(
                        "🔙 Назад",
                        "admin:casino-back",
                    );

            await ctx.reply(
                "📊 Данные казино",
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );

    bot.callbackQuery(
        "admin:casino-upload",
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

            ctx.session.casinoUpload = {
                step: "WAITING_CSV",
            };

            await ctx.reply(
                `📤 Загрузка данных казино

    Отправь мне CSV-файл из backoffice.

    Для отмены отправь /cancel`,
            );
        },
    );

    bot.callbackQuery(
        "admin:casino-imports",
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

            const imports =
                await importRepository
                    .findAll();

            if (imports.length === 0) {
                await ctx.reply(
                    "📜 История импортов пуста.",
                );

                return;
            }

            const recentImports =
                imports.slice(
                    0,
                    10,
                );

            const text =
                recentImports
                    .map(
                        (item) => {
                            const status =
                                item.status ===
                                "SUCCESS"
                                    ? "✅"
                                    : "❌";

                            const source =
                                item.source ===
                                "TELEGRAM"
                                    ? "Telegram"
                                    : item.source ===
                                    "PLAYWRIGHT"
                                        ? "Playwright"
                                        : "CLI";

                            const date =
                                item.startedAt
                                    .toLocaleString(
                                        "ru-RU",
                                    );

                            return [
                                `${status} Импорт #${item.id}`,
                                `📥 Источник: ${source}`,
                                `📄 Файл: ${item.fileName ?? "—"}`,
                                `📊 Строк: ${item.totalRows}`,
                                `✅ Импортировано: ${item.importedRows}`,
                                `⚠️ Пропущено: ${item.skippedRows}`,
                                `🕐 ${date}`,
                            ].join("\n");
                        },
                    )
                    .join(
                        "\n\n────────────\n\n",
                    );

            const keyboard =
                new InlineKeyboard()
                    .text(
                        "🔄 Обновить",
                        "admin:casino-imports",
                    )
                    .row()
                    .text(
                        "🔙 Назад",
                        "admin:casino-data",
                    );

            await ctx.reply(
                `📜 История импортов\n\n${text}`,
                {
                    reply_markup:
                        keyboard,
                },
            );
        },
    );

    bot.callbackQuery(
        "admin:casino-back",
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

            await showMainMenu(ctx);
        },
    );

    /*
     * Получение документа.
     */
    bot.on(
        "message:document",
        async (ctx, next) => {

            const state =
                ctx.session.casinoUpload;

            /*
             * Если сейчас не ждём CSV —
             * не мешаем другим handlers.
             */
            if (!state) {
                await next();

                return;
            }


            if (
                !(await isAdmin(ctx))
            ) {
                delete ctx.session
                    .casinoUpload;

                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            const document =
                ctx.message.document;

            const fileName =
                document.file_name ??
                "casino.csv";


            if (
                !fileName
                    .toLowerCase()
                    .endsWith(".csv")
            ) {
                await ctx.reply(
                    `❌ Нужен файл формата .csv

Попробуй отправить CSV ещё раз.`,
                );

                return;
            }


            await ctx.reply(
                "⏳ Загружаю и обрабатываю файл...",
            );


            const uploadsDir =
                path.resolve(
                    "./data/uploads",
                );


            fs.mkdirSync(
                uploadsDir,
                {
                    recursive: true,
                },
            );


            const tempFilePath =
                path.join(
                    uploadsDir,
                    `${randomUUID()}.csv`,
                );


            try {

                /*
                 * Получаем file_path
                 * через Telegram Bot API.
                 */
                const telegramFile =
                    await ctx.api.getFile(
                        document.file_id,
                    );


                if (
                    !telegramFile.file_path
                ) {
                    throw new Error(
                        "Telegram did not return file_path",
                    );
                }


                /*
                 * Скачиваем CSV.
                 */
                const downloadUrl =
                    `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${telegramFile.file_path}`;


                const response =
                    await fetch(
                        downloadUrl,
                    );


                if (!response.ok) {
                    throw new Error(
                        `Failed to download Telegram file: ${response.status}`,
                    );
                }


                const buffer =
                    Buffer.from(
                        await response.arrayBuffer(),
                    );


                fs.writeFileSync(
                    tempFilePath,
                    buffer,
                );


                /*
                * Получаем внутреннего пользователя
                * для audit history.
                */
                const adminUser =
                    await userService
                        .getOrCreateTelegramUser({
                            telegramId:
                                String(ctx.from.id),

                            username:
                                ctx.from.username,

                            firstName:
                                ctx.from.first_name,
                        });

                if (!adminUser) {
                    throw new Error(
                        "ADMIN_USER_NOT_FOUND",
                    );
                }


                /*
                * Импортируем CSV и одновременно
                * записываем историю импорта.
                */
                const result =
                    await importService
                        .importFile(
                            tempFilePath,
                            {
                                source:
                                    "TELEGRAM",

                                fileName,

                                uploadedByUserId:
                                    adminUser.id,
                            },
                        );


                delete ctx.session
                    .casinoUpload;


                await ctx.reply(
                    `✅ Данные казино обновлены

📄 Файл: ${fileName}
📊 Строк: ${result.totalRows}
✅ Импортировано: ${result.imported}
⚠️ Пропущено: ${result.skipped}`,
                );
                await showMainMenu(ctx);

            } catch (error) {

                console.error(
                    "Casino CSV upload error:",
                    error,
                );


                await ctx.reply(
                    `❌ Не удалось импортировать CSV.

Проверь формат файла и попробуй ещё раз.`,
                );

            } finally {

                /*
                 * CSV после импорта нам
                 * локально больше не нужен.
                 */
                if (
                    fs.existsSync(
                        tempFilePath,
                    )
                ) {
                    fs.unlinkSync(
                        tempFilePath,
                    );
                }
            }
        },
    );


    /*
     * Отмена.
     */
    bot.command(
        "cancel",
        async (ctx, next) => {

            if (
                !ctx.session.casinoUpload
            ) {
                await next();

                return;
            }

            delete ctx.session
                .casinoUpload;

            await ctx.reply(
                "❌ Загрузка CSV отменена.",
            );
            await showMainMenu(ctx);
        },
    );
}