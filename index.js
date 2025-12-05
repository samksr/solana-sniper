const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const SecurityScanner = require('./src/security');
const Database = require('./src/database');
require('dotenv').config();

const PORT = process.env.PORT || 8080;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SECRET = process.env.MACRO_SECRET || 'sniper123';

const bot = new Telegraf(TOKEN);
const app = express();
const db = new Database();
const scanner = new SecurityScanner();

app.use(express.json());

// Smart Linker
const getTwitterLink = (user) => {
    if (/[^a-zA-Z0-9_]/.test(user)) return `https://x.com/search?q=${encodeURIComponent(user)}`;
    return `https://x.com/${user}`;
};

const sendAlert = async (user, text) => {
    const caMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    const ca = caMatch ? caMatch[0] : null;
    
    // 📢 SCENARIO 1: NEWS TWEET (No CA) - PREMIUM BUTTONS
    if (!ca) {
        const buttons = [
            [ Markup.button.url(`🐦 Tweet by ${user}`, getTwitterLink(user)) ],
            [ Markup.button.url(`🔎 Search "${user}"`, `https://x.com/search?q=${encodeURIComponent(user)}`) ]
        ];
        
        const msg = `📢 <b>NEW TWEET</b>\n\n` +
                    `👤 <b>${user}</b>\n` +
                    `📄 <i>${text}</i>\n\n` +
                    `🚀 <i>V17.2 Premium News</i>`;
                    
        return await bot.telegram.sendMessage(CHAT_ID, msg, { 
            parse_mode: 'HTML', 
            disable_web_page_preview: true, 
            ...Markup.inlineKeyboard(buttons) 
        });
    }

    // 🚨 SCENARIO 2: SNIPER ALERT (With CA)
    const scan = await scanner.scan(ca);
    let securitySection = '';

    if (scan) {
        securitySection = `\n📊 <b>SECURITY REPORT</b>\n` +
                          `├ 👮 <b>Score:</b> ${scan.riskColor} ${scan.score}/100\n` +
                          `├ 🧊 <b>Freeze:</b> ${scan.freeze}  |  🖨️ <b>Mint:</b> ${scan.mint}\n` +
                          `└ 🐋 <b>Top 10:</b> ${scan.holders} (${scan.lp})\n\n` +
                          (scan.score < 80 ? `⚠️ <b>Warnings:</b> ${scan.warnings}\n` : '');
    }

    const buttons = [
        [
            Markup.button.url('🦄 Buy (Trojan)', `https://t.me/solana_trojanbot?start=${ca}`),
            Markup.button.url('⚡ GMGN', `https://gmgn.ai/sol/token/${ca}`)
        ],
        [
            Markup.button.url('🦅 DexScreener', `https://dexscreener.com/solana/${ca}`),
            Markup.button.url('🛡️ RugCheck', `https://rugcheck.xyz/tokens/${ca}`)
        ],
        [
            Markup.button.url(`🐦 Tweet by ${user}`, getTwitterLink(user))
        ]
    ];

    const body = `🚨 <b>ALPHA CALL DETECTED</b>\n` +
                 `👤 <b>Source:</b> ${user}\n\n` +
                 `💎 <b>CONTRACT ADDRESS</b>\n` +
                 `<code>${ca}</code>\n` +
                 securitySection + 
                 `🚀 <i>V17.2 Premium Sniper</i>`;

    await bot.telegram.sendMessage(CHAT_ID, body, { 
        parse_mode: 'HTML', 
        disable_web_page_preview: true, 
        ...Markup.inlineKeyboard(buttons) 
    });
    
    await db.log(ca, user);
};

app.get('/', (req, res) => res.send('🟢 V17.2 Premium Online'));
app.get('/notify', async (req, res) => {
    const { secret, title, text } = req.query;
    if (secret !== SECRET) return res.status(403).send('Forbidden');
    let cleanUser = (title || 'Unknown').replace(/New tweet from |Tweet from /gi, '').trim();
    sendAlert(cleanUser, text || '');
    res.send('OK');
});

async function main() {
    await db.init();
    bot.launch();
    app.listen(PORT, () => console.log(`🚀 V17.2 Running on ${PORT}`));
}
main();
