require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const Parser = require("rss-parser");
const NodeCache = require("node-cache");

const parser = new Parser();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const cache = new NodeCache({ stdTTL: 0 }); // ไม่มีหมดอายุ (หรือกำหนดเองได้)

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL;
const LAST_VIDEO_KEY = "lastVideoId";

async function checkForNewVideo() {
    const feed = await parser.parseURL(RSS_URL);
    const latest = feed.items[0];
    const lastVideoId = cache.get(LAST_VIDEO_KEY);

    if (latest && latest.id !== lastVideoId) {
        const discordChannel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        await discordChannel.send(
            `📢 **${latest.title}**\n${latest.link}`
        );
        cache.set(LAST_VIDEO_KEY, latest.id);
    }
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    checkForNewVideo();
    setInterval(checkForNewVideo, 10 * 60 * 1000); // ทุก 10 นาที
});

client.login(process.env.DISCORD_TOKEN);
