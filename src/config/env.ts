import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
    throw new Error(
        "BOT_TOKEN is not defined. Add it to the .env file."
    );
}

export const env = {
    BOT_TOKEN,
};