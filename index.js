require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const Parser = require("rss-parser");
const fs = require('fs');
const path = require('path');

const parser = new Parser();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID;
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL;
const CACHE_FILE = path.join(__dirname, 'cache.json');

function readCache() {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
}

function writeCache(data) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
}

async function checkForNewVideo() {
    const feed = await parser.parseURL(RSS_URL);
    const latest = feed.items[0];
    const cache = readCache();
    const lastVideoId = cache.lastVideoId;

    if (latest && latest.id !== lastVideoId) {
        const discordChannel = await client.channels.fetch(DISCORD_CHANNEL_ID);
        await discordChannel.send(
            `📢 **${latest.title}**\n${latest.link}`
        );
        cache.lastVideoId = latest.id;
        writeCache(cache);
    }
}

client.once("ready", () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    client.user.setPresence({
        status: 'online', // online, idle, dnd (Do Not Disturb), invisible
        activities: [{
            name: process.env.ACTIVITY_NAME,
            type: ActivityType[process.env.ACTIVITY_TYPE], // Playing, Streaming, Listening, Watching, Competing
        }],
    });
    checkForNewVideo();
    setInterval(checkForNewVideo, 10 * 60 * 1000); // Every 10 Mins
});

client.login(process.env.DISCORD_TOKEN);