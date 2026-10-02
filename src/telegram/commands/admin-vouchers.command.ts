import fs from "node:fs";
import path from "node:path";

import {
    randomUUID,
} from "node:crypto";

import {
    InlineKeyboard,
    type Bot,
} from "grammy";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    UserService,
} from "../../modules/users/user.service.js";

import {
    VoucherRepository,
} from "../../modules/vouchers/voucher.repository.js";

import {
    VoucherImportService,
} from "../../modules/vouchers/voucher-import.service.js";

import {
    env,
} from "../../config/env.js";

import {
    showMainMenu,
} from "../helpers/show-main-menu.js";


const userService =
    new UserService();

const voucherRepository =
    new VoucherRepository();

const voucherImportService =
    new VoucherImportService();


/*
 * =====================================
 * ADMIN CHECK
 * =====================================
 */
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


    return (
        user?.role ===
        "ADMIN"
    );
}


/*
 * =====================================
 * REGISTER
 * =====================================
 */
export function registerAdminVouchersCommand(
    bot: Bot<BotContext>,
) {

    /*
     * =====================================
     * VOUCHER MENU
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            delete ctx.session
                .voucherUpload;


            await showVoucherMenu(
                ctx,
            );
        },
    );


    /*
     * =====================================
     * REFRESH STATISTICS
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers:stats",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            await showVoucherMenu(
                ctx,
            );
        },
    );


    /*
     * =====================================
     * START FILE UPLOAD
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers:upload",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            /*
             * Не позволяем одновременно
             * ждать casino CSV.
             */
            delete ctx.session
                .casinoUpload;


            ctx.session.voucherUpload = {
                step:
                    "WAITING_FILE",
            };


            const keyboard =
                new InlineKeyboard()
                    .text(
                        "❌ Отмена",
                        "admin:vouchers:cancel",
                    );


            await ctx.reply(
                `📤 <b>Загрузка ваучеров из файла</b>

Отправь файл <b>.txt</b> или <b>.csv</b>.

Поддерживается, например:

<code>A7K9M2Q4XZ    1000 р 1 акт
B3N8T5R1LP    1000 р 1 акт
L6Q2N9H4BW    2000 р 1 акт
W6K9T3M2HF    5000 р 1 акт</code>

Также можно использовать CSV:

<code>code,amount,currency
A7K9M2Q4XZ,1000,RUB
L6Q2N9H4BW,2000,RUB</code>`,
                {
                    parse_mode:
                        "HTML",

                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    /*
     * =====================================
     * START TEXT IMPORT
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers:text",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );

                return;
            }


            delete ctx.session
                .casinoUpload;


            ctx.session.voucherUpload = {
                step:
                    "WAITING_TEXT",
            };


            const keyboard =
                new InlineKeyboard()
                    .text(
                        "❌ Отмена",
                        "admin:vouchers:cancel",
                    );


            await ctx.reply(
                `📋 <b>Вставь ваучеры сообщением</b>

Можно просто скопировать весь список и отправить одним сообщением.

Например:

<code>A7K9M2Q4XZ    1000 р 1 акт
B3N8T5R1LP    1000 р 1 акт
C6V2H9W4JD    1000 р 1 акт
L6Q2N9H4BW    2000 р 1 акт
W6K9T3M2HF    5000 р 1 акт</code>

Бот автоматически определит:

• код ваучера;
• номинал;
• валюту RUB.

Текст <code>1 акт</code> будет проигнорирован.`,
                {
                    parse_mode:
                        "HTML",

                    reply_markup:
                        keyboard,
                },
            );
        },
    );


    /*
     * =====================================
     * FILE DOCUMENT
     * =====================================
     */
    bot.on(
        "message:document",
        async (ctx, next) => {

            const state =
                ctx.session
                    .voucherUpload;


            /*
             * Это не voucher upload.
             * Передаём handler дальше.
             */
            if (
                !state ||
                state.step !==
                    "WAITING_FILE"
            ) {

                await next();

                return;
            }


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                delete ctx.session
                    .voucherUpload;


                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );


                return;
            }


            const document =
                ctx.message.document;


            const fileName =
                document.file_name ??
                "vouchers.txt";


            const lowerFileName =
                fileName
                    .toLowerCase();


            /*
             * Пока разрешаем TXT и CSV.
             */
            if (
                !lowerFileName.endsWith(
                    ".txt",
                ) &&
                !lowerFileName.endsWith(
                    ".csv",
                )
            ) {

                await ctx.reply(
                    `❌ Нужен файл .txt или .csv.

Попробуй отправить другой файл.`,
                );


                return;
            }


            await ctx.reply(
                "⏳ Загружаю и проверяю ваучеры...",
            );


            const uploadsDir =
                path.resolve(
                    "./data/uploads",
                );


            fs.mkdirSync(
                uploadsDir,
                {
                    recursive:
                        true,
                },
            );


            const extension =
                lowerFileName.endsWith(
                    ".csv",
                )
                    ? ".csv"
                    : ".txt";


            const tempFilePath =
                path.join(
                    uploadsDir,
                    `${randomUUID()}${extension}`,
                );


            try {

                /*
                 * Получаем Telegram file_path.
                 */
                const telegramFile =
                    await ctx.api
                        .getFile(
                            document.file_id,
                        );


                if (
                    !telegramFile.file_path
                ) {

                    throw new Error(
                        "TELEGRAM_FILE_PATH_NOT_FOUND",
                    );
                }


                /*
                 * Скачиваем файл.
                 */
                const downloadUrl =
                    `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${telegramFile.file_path}`;


                const response =
                    await fetch(
                        downloadUrl,
                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        `TELEGRAM_DOWNLOAD_FAILED:${response.status}`,
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
                 * IMPORT
                 */
                const result =
                    await voucherImportService
                        .importFile(
                            tempFilePath,
                        );


                if (
                    !result.success
                ) {

                    await sendImportErrors(
                        ctx,
                        result.errors,
                        "Файл содержит ошибки",
                    );


                    /*
                     * Оставляем WAITING_FILE.
                     *
                     * Админ может сразу
                     * отправить исправленный файл.
                     */
                    return;
                }


                delete ctx.session
                    .voucherUpload;


                await ctx.reply(
                    buildSuccessMessage(
                        result,
                        `📄 Файл: ${escapeHtml(
                            fileName,
                        )}`,
                    ),
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                await showVoucherMenu(
                    ctx,
                );

            } catch (error) {

                console.error(
                    "Voucher file upload error:",
                    error,
                );


                await sendImportException(
                    ctx,
                    error,
                );

            } finally {

                /*
                 * Временный файл удаляем
                 * независимо от результата.
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
     * =====================================
     * TEXT MESSAGE
     * =====================================
     */
    bot.on(
        "message:text",
        async (ctx, next) => {

            const state =
                ctx.session
                    .voucherUpload;


            if (
                !state ||
                state.step !==
                    "WAITING_TEXT"
            ) {

                await next();

                return;
            }


            const text =
                ctx.message.text
                    .trim();


            /*
             * Позволяем /cancel.
             */
            if (
                text ===
                "/cancel"
            ) {

                delete ctx.session
                    .voucherUpload;


                await ctx.reply(
                    "❌ Загрузка ваучеров отменена.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * Другие команды
             * не перехватываем.
             */
            if (
                text.startsWith(
                    "/",
                )
            ) {

                await next();

                return;
            }


            if (
                !(await isAdmin(
                    ctx,
                ))
            ) {

                delete ctx.session
                    .voucherUpload;


                await ctx.reply(
                    "⛔ Недостаточно прав.",
                );


                return;
            }


            try {

                const result =
                    await voucherImportService
                        .importText(
                            text,
                        );


                if (
                    !result.success
                ) {

                    await sendImportErrors(
                        ctx,
                        result.errors,
                        "Текст содержит ошибки",
                    );


                    /*
                     * WAITING_TEXT оставляем.
                     *
                     * Можно сразу прислать
                     * исправленный список.
                     */
                    return;
                }


                delete ctx.session
                    .voucherUpload;


                await ctx.reply(
                    buildSuccessMessage(
                        result,
                        "📋 Источник: текстовое сообщение",
                    ),
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                await showVoucherMenu(
                    ctx,
                );

            } catch (error) {

                console.error(
                    "Voucher text import error:",
                    error,
                );


                await sendImportException(
                    ctx,
                    error,
                );
            }
        },
    );


    /*
     * =====================================
     * CANCEL BUTTON
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers:cancel",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            delete ctx.session
                .voucherUpload;


            await showVoucherMenu(
                ctx,
            );
        },
    );


    /*
     * =====================================
     * BACK
     * =====================================
     */
    bot.callbackQuery(
        "admin:vouchers:back",
        async (ctx) => {

            await ctx.answerCallbackQuery();


            delete ctx.session
                .voucherUpload;


            await showMainMenu(
                ctx,
            );
        },
    );
}


/*
 * =====================================
 * SHOW VOUCHER MENU
 * =====================================
 */
async function showVoucherMenu(
    ctx: BotContext,
) {

    const stats =
        await voucherRepository
            .getStatistics();


    let message =
        `🎟 <b>Ваучеры</b>

📦 Всего: <b>${stats.total}</b>
✅ Свободно: <b>${stats.available}</b>
🔒 Использовано: <b>${stats.used}</b>`;


    if (
        stats.denominations.length >
        0
    ) {

        message +=
            `

💰 <b>По номиналам:</b>`;


        for (
            const item
            of stats.denominations
        ) {

            message +=
                `

${formatMoney(
    item.amount,
    item.currency,
)}
Свободно: <b>${item.available}</b> / ${item.total}`;
        }

    } else {

        message +=
            `

Ваучеров пока нет.`;
    }


    const keyboard =
        new InlineKeyboard()
            .text(
                "📤 Загрузить файл",
                "admin:vouchers:upload",
            )
            .row()
            .text(
                "📋 Вставить текст",
                "admin:vouchers:text",
            )
            .row()
            .text(
                "🔄 Обновить",
                "admin:vouchers:stats",
            )
            .row()
            .text(
                "🔙 Назад",
                "admin:vouchers:back",
            );


    await ctx.reply(
        message,
        {
            parse_mode:
                "HTML",

            reply_markup:
                keyboard,
        },
    );
}


/*
 * =====================================
 * SUCCESS MESSAGE
 * =====================================
 */
function buildSuccessMessage(
    result: {
        totalRows: number;
        imported: number;
        duplicates: number;
        denominations: {
            amount: number;
            currency: string;
            count: number;
        }[];
    },
    source: string,
) {

    let message =
        `✅ <b>Импорт ваучеров завершён</b>

${source}

📊 Строк: <b>${result.totalRows}</b>
✅ Добавлено: <b>${result.imported}</b>
♻️ Дубликатов: <b>${result.duplicates}</b>`;


    if (
        result.denominations.length >
        0
    ) {

        message +=
            `

💰 <b>Добавлено по номиналам:</b>`;


        for (
            const item
            of result.denominations
        ) {

            message +=
                `

${formatMoney(
    item.amount,
    item.currency,
)} — <b>${item.count}</b> шт.`;
        }
    }


    return message;
}


/*
 * =====================================
 * IMPORT ERRORS
 * =====================================
 */
async function sendImportErrors(
    ctx: BotContext,
    errors: {
        line: number;
        content: string;
        reason: string;
    }[],
    title: string,
) {

    const visibleErrors =
        errors.slice(
            0,
            10,
        );


    let message =
        `❌ <b>${escapeHtml(
            title,
        )}</b>

Ничего не было импортировано.`;


    for (
        const error
        of visibleErrors
    ) {

        message +=
            `

<b>Строка ${error.line}</b>
${escapeHtml(
    error.reason,
)}
<code>${escapeHtml(
    error.content,
)}</code>`;
    }


    if (
        errors.length >
        visibleErrors.length
    ) {

        message +=
            `

...и ещё <b>${
    errors.length -
    visibleErrors.length
}</b> ошибок.`;
    }


    message +=
        `

Исправь данные и отправь ещё раз.`;


    await ctx.reply(
        message,
        {
            parse_mode:
                "HTML",
        },
    );
}


/*
 * =====================================
 * EXCEPTION
 * =====================================
 */
async function sendImportException(
    ctx: BotContext,
    error: unknown,
) {

    const message =
        error instanceof Error
            ? error.message
            : String(
                error,
            );


    if (
        message ===
        "VOUCHER_DATA_EMPTY"
    ) {

        await ctx.reply(
            "❌ Список ваучеров пуст.",
        );


        return;
    }


    await ctx.reply(
        `❌ Не удалось импортировать ваучеры.

Проверь данные и попробуй ещё раз.`,
    );
}


/*
 * =====================================
 * MONEY FORMAT
 * =====================================
 */
function formatMoney(
    amount: number,
    currency: string,
) {

    const formatted =
        new Intl.NumberFormat(
            "ru-RU",
            {
                maximumFractionDigits:
                    2,
            },
        ).format(
            amount,
        );


    if (
        currency ===
        "RUB"
    ) {

        return `${formatted} ₽`;
    }


    return `${formatted} ${currency}`;
}


/*
 * =====================================
 * HTML ESCAPE
 * =====================================
 */
function escapeHtml(
    value: string,
) {

    return value
        .replace(
            /&/g,
            "&amp;",
        )
        .replace(
            /</g,
            "&lt;",
        )
        .replace(
            />/g,
            "&gt;",
        )
        .replace(
            /"/g,
            "&quot;",
        )
        .replace(
            /'/g,
            "&#039;",
        );
}