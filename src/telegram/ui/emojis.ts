export const CUSTOM_EMOJI = {
    star: "5408977655330517200",
    slots: "5969709082049779216",
    diamond: "5465283645788937267",
    gift: "5411271889421086677",
    luckyCat: "5373355432800693886",
    party: "5409162214370193617",
    strawberry: "5429594645107584922",
    fire: "5373310043586310463",
    lightning: "5373066076558996568",
} as const;


export type CustomEmojiName =
    keyof typeof CUSTOM_EMOJI;


const FALLBACK_EMOJI: Record<
    CustomEmojiName,
    string
> = {
    star: "⭐",
    slots: "🎰",
    diamond: "💎",
    gift: "🎁",
    luckyCat: "🍀",
    party: "🎉",
    strawberry: "🍓",
    fire: "🔥",
    lightning: "⚡",
};


export function emoji(
    name: CustomEmojiName,
) {
    return `<tg-emoji emoji-id="${
        CUSTOM_EMOJI[name]
    }">${
        FALLBACK_EMOJI[name]
    }</tg-emoji>`;
}