// ================== Module Imports ==================
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    jidNormalizedUser, 
    getContentType, 
    fetchLatestBaileysVersion, 
    Browsers 
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const { File } = require('megajs');
const express = require("express");
const path = require('path');

// ================== Custom Imports ==================
const { 
    getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson 
} = require('./lib/functions');
const { sms, downloadMediaMessage } = require('./lib/msg');
const connectDB = require('./lib/mongodb');
const { readEnv } = require('./lib/database');

// ================== Configuration ==================
require('dotenv').config(); // Load environment variables
const config = {
    SESSION_ID: process.env.SESSION_ID,
    PREFIX: process.env.PREFIX || "!",
    MODE: process.env.MODE || "public", // public, private, groups, inbox
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "true"
};
const ownerNumber = [process.env.OWNER_NUMBER || '94766087184'];

// ================== Check Session File ==================
if (!fs.existsSync(__dirname + '/auth_info_baileys/creds.json')) {
    if (!config.SESSION_ID) {
        console.log('Please add your session to SESSION_ID env !!');
        process.exit(1);
    }

    const filer = File.fromURL(`https://mega.nz/file/${config.SESSION_ID}`);
    filer.download((err, data) => {
        if (err) throw err;
        fs.writeFile(__dirname + '/auth_info_baileys/creds.json', data, () => {
            console.log("Session downloaded ✅");
        });
    });
}

// ================== Express App ==================
const app = express();
const port = process.env.PORT || 8000;

// ================== Connect to WhatsApp ==================
async function connectToWA() {
    console.log("Connecting SL_PANCHA_MD bot ☠👋...");

    // MongoDB Connection
    connectDB();

    // Load Environment Config
    const dbConfig = await readEnv();
    const prefix = dbConfig.PREFIX || config.PREFIX;

    // WhatsApp Socket Connection
    const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys/');
    const { version } = await fetchLatestBaileysVersion();

    const conn = makeWASocket({
        logger: P({ level: 'silent' }),
        browser: Browsers.macOS("Firefox"),
        auth: state,
        version
    });

    conn.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) {
                connectToWA();
            }
        } else if (connection === 'open') {
            console.log('✅ Bot connected to SL_PANCHA_MD WhatsApp!');
            loadPlugins(conn);

            conn.sendMessage(ownerNumber[0] + "@s.whatsapp.net", {
                image: { url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhyWYx5_IFWOx3de2MtnBrwxK_r1gcNhwa6w&s' },
                caption: `SL_PANCHA_MD WhatsApp bot connected successfully ✅\n\nPREFIX: ${prefix}`
            });
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async (mek) => {
        try {
            const m = sms(conn, mek.messages[0]);
            if (!m) return;

            // Command Handler
            if (m.isCommand) {
                const events = require('./command');
                const cmd = events.commands.find((cmd) => cmd.pattern === m.command);
                if (cmd) {
                    await cmd.function(conn, mek.messages[0], m);
                }
            }
        } catch (e) {
            console.error("[MESSAGE HANDLER ERROR]", e.stack);
        }
    });
}

// ================== Load Plugins ==================
function loadPlugins(conn) {
    const pluginDir = "./plugins/";
    fs.readdirSync(pluginDir).forEach((plugin) => {
        if (path.extname(plugin).toLowerCase() === ".js") {
            try {
                require(pluginDir + plugin)(conn);
                console.log(`Loaded plugin: ${plugin}`);
            } catch (e) {
                console.error(`[PLUGIN ERROR] ${plugin}:`, e.stack);
            }
        }
    });
}

// ================== Start Server ==================
app.get("/", (req, res) => {
    res.send("Hey, SL_PANCHA_MD WhatsApp bot started ✅");
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

// Start the bot
setTimeout(() => {
    connectToWA();
}, 4000);
