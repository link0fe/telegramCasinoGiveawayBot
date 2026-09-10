import type {
    Bot,
} from "grammy";
import {
    ParticipantService,
} from "../../modules/participants/participant.service.js";
import type {
    BotContext,
} from "../session/bot-session.js";
import {
    showMainMenu,
} from "../helpers/show-main-menu.js";


const participantService =
    new ParticipantService();


export function registerJoinGiveawayCommand(
    bot: Bot<BotContext>,
) {

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


            ctx.session.participation = {
                giveawayId,
                step:
                    "WAITING_PLAYER_ID",
            };


            await ctx.reply(
                `🎰 Отправь свой Player ID.

Например:
100001

Для отмены:
/cancel`,
            );
        },
    );


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


            if (
                text === "/cancel"
            ) {
                delete ctx.session
                    .participation;

                await ctx.reply(
                    "❌ Участие отменено.",
                );

                return;
            }


            if (
                text.startsWith("/")
            ) {
                await next();
                return;
            }


            const playerId =
                text;


            if (
                !/^\d+$/.test(
                    playerId,
                )
            ) {
                await ctx.reply(
                    "❌ Player ID должен состоять только из цифр.",
                );

                return;
            }


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


            if (result.success) {

                delete ctx.session
                    .participation;

                await ctx.reply(
                    `✅ Ты участвуешь в розыгрыше!

🎰 Player ID: ${playerId}

Удачи! 🍀`,
                );

                return;
            }
            await showMainMenu(ctx);


            switch (result.reason) {

                case "ALREADY_JOINED":
                    await ctx.reply(
                        "⚠️ Ты уже участвуешь в этом розыгрыше.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "PLAYER_ID_ALREADY_USED":
                    await ctx.reply(
                        "❌ Этот Player ID уже используется другим участником.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "PLAYER_NOT_FOUND":
                    await ctx.reply(
                        "❌ Такой Player ID не найден.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "WRONG_AFFILIATE":
                    await ctx.reply(
                        "❌ Этот Player ID не относится к партнеру данного розыгрыша.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "NO_FIRST_DEPOSIT":
                    await ctx.reply(
                        "❌ Для участия необходим первый депозит.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "FIRST_DEPOSIT_TOO_SMALL":
                    await ctx.reply(
                        "❌ Сумма первого депозита недостаточна для участия.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "GIVEAWAY_ENDED":
                    delete ctx.session
                        .participation;

                    await ctx.reply(
                        "⏰ Розыгрыш уже завершён.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "GIVEAWAY_NOT_ACTIVE":
                    delete ctx.session
                        .participation;

                    await ctx.reply(
                        "❌ Этот розыгрыш сейчас недоступен.",
                    );
                    await showMainMenu(ctx);
                    break;


                case "GIVEAWAY_NOT_FOUND":
                    delete ctx.session
                        .participation;

                    await ctx.reply(
                        "❌ Розыгрыш не найден.",
                    );
                    await showMainMenu(ctx);
                    break;


                default:
                    await ctx.reply(
                        "❌ Не удалось проверить участие.",
                    );
                    await showMainMenu(ctx);
            }
        },
    );
}