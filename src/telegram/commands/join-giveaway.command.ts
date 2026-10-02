import type {
    Bot,
} from "grammy";

import {
    ParticipantService,
} from "../../modules/participants/participant.service.js";

import {
    PlayerAccountService,
} from "../../modules/player-accounts/player-account.service.js";

import type {
    BotContext,
} from "../session/bot-session.js";

import {
    showMainMenu,
} from "../helpers/show-main-menu.js";

import {
    GiveawayService,
} from "../../modules/giveaways/giveaway.service.js";

import {
    emoji,
} from "../ui/emojis.js";


const participantService =
    new ParticipantService();

const playerAccountService =
    new PlayerAccountService();

const giveawayService =
    new GiveawayService();


const MAX_PLAYER_ID_ATTEMPTS =
    5;


export function registerJoinGiveawayCommand(
    bot: Bot<BotContext>,
) {

    /*
     * =====================================
     * JOIN GIVEAWAY BUTTON
     * =====================================
     */
    bot.callbackQuery(
        /^giveaway:join:(\d+)$/,
        async (ctx) => {
            await ctx.answerCallbackQuery();


            const giveawayId =
                Number(
                    ctx.match[1],
                );


            if (
                !Number.isInteger(
                    giveawayId,
                )
            ) {
                await ctx.reply(
                    "❌ Некорректный розыгрыш.",
                );

                return;
            }


            const giveaway =
                await giveawayService
                    .getGiveawayById(
                        giveawayId,
                    );


            if (!giveaway) {
                await ctx.reply(
                    "❌ Розыгрыш не найден.",
                );

                return;
            }


            /*
             * Проверяем постоянную привязку:
             *
             * Telegram user
             *      ↓
             * player_accounts
             *      ↓
             * casino_players
             */
            const linkedPlayer =
                await playerAccountService
                    .getLinkedPlayer(
                        String(
                            ctx.from.id,
                        ),
                    );


            /*
             * =====================================
             * PLAYER УЖЕ ПРИВЯЗАН
             * =====================================
             *
             * Player ID больше не спрашиваем.
             */
            if (linkedPlayer) {

                const result =
                    await participantService
                        .joinGiveaway(
                            giveawayId,

                            String(
                                ctx.from.id,
                            ),
                        );


                /*
                 * Успешное участие.
                 */
                if (result.success) {

                    delete ctx.session
                        .participation;


                    await ctx.reply(
                        `${emoji("luckyCat")} <b>Ты участвуешь в розыгрыше!</b>

${emoji("slots")} Player ID: <code>${result.casinoPlayerId}</code>

${emoji("star")} Удачи!`,
                        {
                            parse_mode:
                                "HTML",
                        },
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Уже участвует.
                 */
                if (
                    result.reason ===
                    "ALREADY_JOINED"
                ) {
                    await ctx.reply(
                        "⚠️ Ты уже участвуешь в этом розыгрыше.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Giveaway закончился.
                 */
                if (
                    result.reason ===
                    "GIVEAWAY_ENDED"
                ) {
                    await ctx.reply(
                        "⏰ Розыгрыш уже завершён.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Giveaway недоступен.
                 */
                if (
                    result.reason ===
                    "GIVEAWAY_NOT_ACTIVE"
                ) {
                    await ctx.reply(
                        "❌ Этот розыгрыш сейчас недоступен.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Giveaway не найден.
                 */
                if (
                    result.reason ===
                    "GIVEAWAY_NOT_FOUND"
                ) {
                    await ctx.reply(
                        "❌ Розыгрыш не найден.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Не тот affiliate.
                 *
                 * Такое возможно:
                 * Player ID уже привязан,
                 * но giveaway принадлежит
                 * другому partner.
                 */
                if (
                    result.reason ===
                    "WRONG_AFFILIATE"
                ) {
                    await ctx.reply(
                        "❌ Ваш игровой аккаунт не подходит для участия в этом розыгрыше.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Нет FTD.
                 */
                if (
                    result.reason ===
                    "NO_FIRST_DEPOSIT"
                ) {
                    await ctx.reply(
                        "❌ Для участия необходим первый депозит.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * FTD слишком маленький.
                 */
                if (
                    result.reason ===
                    "FIRST_DEPOSIT_TOO_SMALL"
                ) {
                    await ctx.reply(
                        "❌ Сумма первого депозита недостаточна для участия.",
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Защитный fallback.
                 */
                console.error(
                    "Linked player join failed:",
                    result,
                );


                await ctx.reply(
                    "❌ Не удалось зарегистрировать участие.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * PLAYER ЕЩЁ НЕ ПРИВЯЗАН
             * =====================================
             *
             * Только здесь спрашиваем Player ID.
             */
            ctx.session.participation = {
                giveawayId,

                step:
                    "WAITING_PLAYER_ID",

                attempts:
                    0,
            };


            await ctx.reply(
                `${emoji("slots")} <b>Подтверждение игрового аккаунта</b>

Для первого участия необходимо привязать свой <b>Player ID</b>.

Отправь Player ID сообщением ниже.

Например:
<code>100001</code>

${emoji("star")} После успешной проверки Player ID будет сохранён, и в следующих розыгрышах вводить его повторно не потребуется.

Для отмены:
/cancel`,
                {
                    parse_mode:
                        "HTML",
                },
            );
        },
    );


    /*
     * =====================================
     * PLAYER ID INPUT
     * =====================================
     */
    bot.on(
        "message:text",
        async (ctx, next) => {

            const participation =
                ctx.session
                    .participation;


            if (!participation) {
                await next();

                return;
            }


            const text =
                ctx.message.text
                    .trim();


            /*
             * =====================================
             * CANCEL
             * =====================================
             */
            if (
                text ===
                "/cancel"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "❌ Участие отменено.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * Остальные команды
             * не перехватываем.
             */
            if (
                text.startsWith("/")
            ) {
                await next();

                return;
            }


            /*
             * =====================================
             * BASIC FORMAT VALIDATION
             * =====================================
             */
            if (
                !/^\d+$/.test(
                    text,
                )
            ) {
                await ctx.reply(
                    `❌ <b>Некорректный формат</b>

Player ID должен состоять только из цифр.

Например:
<code>100001</code>`,
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                return;
            }


            const playerId =
                text;


            /*
             * =====================================
             * JOIN + ELIGIBILITY + LINK
             * =====================================
             */
            const result =
                await participantService
                    .joinGiveaway(
                        participation
                            .giveawayId,

                        String(
                            ctx.from.id,
                        ),

                        playerId,
                    );


            /*
             * =====================================
             * SUCCESS
             * =====================================
             */
            if (result.success) {

                delete ctx.session
                    .participation;


                await ctx.reply(
                    `${emoji("luckyCat")} <b>Ты участвуешь в розыгрыше!</b>

${emoji("slots")} Player ID: <code>${result.casinoPlayerId}</code>

${emoji("star")} Игровой аккаунт успешно подтверждён и привязан.

В следующих розыгрышах Player ID вводить повторно не потребуется.

${emoji("star")} Удачи!`,
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * ALREADY JOINED
             * =====================================
             */
            if (
                result.reason ===
                "ALREADY_JOINED"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "⚠️ Ты уже участвуешь в этом розыгрыше.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * INVALID / USED PLAYER ID
             * =====================================
             *
             * ВАЖНО:
             *
             * Не сообщаем пользователю,
             * существует ID или он уже
             * принадлежит другому Telegram.
             *
             * Для обеих ситуаций ответ одинаковый.
             */
            if (
                result.reason ===
                    "PLAYER_NOT_FOUND" ||
                result.reason ===
                    "PLAYER_ID_ALREADY_USED" ||
                result.reason ===
                    "TELEGRAM_ALREADY_LINKED" ||
                result.reason ===
                    "USER_NOT_FOUND"
            ) {

                participation.attempts +=
                    1;


                const attemptsLeft =
                    MAX_PLAYER_ID_ATTEMPTS -
                    participation.attempts;


                /*
                 * Лимит достигнут.
                 */
                if (
                    attemptsLeft <= 0
                ) {
                    delete ctx.session
                        .participation;


                    await ctx.reply(
                        `🔒 <b>Не удалось подтвердить Player ID.</b>

Превышено количество попыток.

Попробуй позже.`,
                        {
                            parse_mode:
                                "HTML",
                        },
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                await ctx.reply(
                    `❌ <b>Не удалось подтвердить Player ID.</b>

Проверь введённые данные и попробуй ещё раз.

Осталось попыток: <b>${attemptsLeft}</b>`,
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                return;
            }


            /*
             * =====================================
             * WRONG AFFILIATE
             * =====================================
             *
             * Этот Player ID существует,
             * но использовать его в данном
             * giveaway нельзя.
             *
             * Привязка НЕ создаётся.
             */
            if (
                result.reason ===
                "WRONG_AFFILIATE"
            ) {
                participation.attempts +=
                    1;


                const attemptsLeft =
                    MAX_PLAYER_ID_ATTEMPTS -
                    participation.attempts;


                if (
                    attemptsLeft <= 0
                ) {
                    delete ctx.session
                        .participation;


                    await ctx.reply(
                        `🔒 <b>Не удалось подтвердить игровой аккаунт.</b>

Превышено количество попыток.

Попробуй позже.`,
                        {
                            parse_mode:
                                "HTML",
                        },
                    );


                    await showMainMenu(
                        ctx,
                    );


                    return;
                }


                /*
                 * Тоже не раскрываем,
                 * что именно affiliate
                 * оказался неправильным.
                 */
                await ctx.reply(
                    `❌ <b>Не удалось подтвердить игровой аккаунт.</b>

Проверь Player ID и попробуй ещё раз.

Осталось попыток: <b>${attemptsLeft}</b>`,
                    {
                        parse_mode:
                            "HTML",
                    },
                );


                return;
            }


            /*
             * =====================================
             * NO FIRST DEPOSIT
             * =====================================
             *
             * Здесь Player ID валидный,
             * но условия giveaway не выполнены.
             *
             * Binding мы НЕ создавали,
             * потому что eligibility не прошла.
             */
            if (
                result.reason ===
                "NO_FIRST_DEPOSIT"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "❌ Для участия необходим первый депозит.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * FTD TOO SMALL
             * =====================================
             */
            if (
                result.reason ===
                "FIRST_DEPOSIT_TOO_SMALL"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "❌ Сумма первого депозита недостаточна для участия.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * GIVEAWAY ENDED
             * =====================================
             */
            if (
                result.reason ===
                "GIVEAWAY_ENDED"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "⏰ Розыгрыш уже завершён.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * GIVEAWAY NOT ACTIVE
             * =====================================
             */
            if (
                result.reason ===
                "GIVEAWAY_NOT_ACTIVE"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "❌ Этот розыгрыш сейчас недоступен.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * GIVEAWAY NOT FOUND
             * =====================================
             */
            if (
                result.reason ===
                "GIVEAWAY_NOT_FOUND"
            ) {
                delete ctx.session
                    .participation;


                await ctx.reply(
                    "❌ Розыгрыш не найден.",
                );


                await showMainMenu(
                    ctx,
                );


                return;
            }


            /*
             * =====================================
             * FALLBACK
             * =====================================
             */
            console.error(
                "Join giveaway failed:",
                result,
            );


            delete ctx.session
                .participation;


            await ctx.reply(
                "❌ Не удалось проверить участие.",
            );


            await showMainMenu(
                ctx,
            );
        },
    );
}