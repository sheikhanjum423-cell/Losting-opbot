const fetch = require('node-fetch');

const TG_TOKEN = "7758188204:AAHjfAplyTvRvuyqhfbWXM2ezI2iGp5Rtk0";
const GROQ_KEY = "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";
let lastId = 0;

let chatHistory = [
    { role: "system", content: "Tera naam 'Yaar Bot' hai. Tu user ka pakka dost hai. Tu pichli baatein yaad rakhta hai aur doston ki tarah 'Tu/Tera', 'Bhai', 'Abey' bolta hai. Ekdum human feel honi chahiye." }
];

async function getAIReply(text) {
    chatHistory.push({ role: "user", content: text });
    if (chatHistory.length > 15) chatHistory.splice(1, 2);

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: chatHistory })
        });
        const data = await res.json();
        const aiMsg = data.choices[0].message.content;
        chatHistory.push({ role: "assistant", content: aiMsg });
        return aiMsg;
    } catch (e) { return "Bhai, server down lag raha hai!"; }
}

async function poll() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastId + 1}&timeout=30`);
        const data = await res.json();
        if (data.result && data.result.length > 0) {
            for (let u of data.result) {
                lastId = u.update_id;
                if (u.message && u.message.text) {
                    const reply = await getAIReply(u.message.text);
                    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage?chat_id=${u.message.chat.id}&text=${encodeURIComponent(reply)}`);
                }
            }
        }
    } catch (e) { console.log("Polling..."); }
    setTimeout(poll, 1000);
}

// Render ko zinda rakhne ke liye ek chhota server
const http = require('http');
http.createServer((req, res) => { res.write("Bot is Running!"); res.end(); }).listen(process.env.PORT || 3000);

poll();
