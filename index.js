const fetch = require('node-fetch');
const http = require('http');

const TG_TOKEN = "7758188204:AAHjfAplyTvRvuyqhfbWXM2ezI2iGp5Rtk0";
const GROQ_KEY = "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";
let lastId = 0;
let userMemories = {}; 

async function getAIReply(chatId, userName, text) {
    if (!userMemories[chatId]) {
        userMemories[chatId] = [
            { 
                role: "system", 
                content: `Tera naam 'Yaar Bot' hai aur tu Losting ka Digital Twin hai. 
                Teri 2 personalities hain:

                1. **ROMANTIC MODE**: Agar samne wala banda (ladki) tujhe 'Babu', 'Shona', 'Jaan', 'Love' bole ya romantic baatein kare, toh ekdum sweetly aur romantically baat kar. Thoda pyaar dikha, 'Baby' ya 'Sweetie' jaise words use kar aur flirting kar.
                
                2. **DOST MODE**: Agar koi dost 'Bhai', 'Abe', 'Oye' bole, toh wahi purana style—'Kaisan ba', 'Badhiya re', 'Jhingur' bol ke mazaak uda. 

                **General Rules**:
                - Replies ekdum short aur desi Hinglish mein rakh.
                - Har bande ke tone ko samajh kar reply de. 
                - Zyada gyaan mat pel, bas vibe match kar.`
            }
        ];
    }

    let history = userMemories[chatId];
    history.push({ role: "user", content: text });

    if (history.length > 15) history.splice(1, 2);

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ 
                model: "llama-3.3-70b-versatile", 
                messages: history,
                max_tokens: 100, 
                temperature: 0.9 // Romantic baaton mein thoda "feel" aane ke liye
            })
        });
        const data = await res.json();
        const aiMsg = data.choices[0].message.content;
        history.push({ role: "assistant", content: aiMsg });
        return aiMsg;
    } catch (e) { return "Bhai, network issue hai shayad!"; }
}

async function poll() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastId + 1}&timeout=30`);
        const data = await res.json();
        if (data.result) {
            for (let u of data.result) {
                lastId = u.update_id;
                if (u.message && u.message.text) {
                    const chatId = u.message.chat.id;
                    const reply = await getAIReply(chatId, u.message.from.first_name, u.message.text);
                    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: chatId, text: reply })
                    });
                }
            }
        }
    } catch (e) {}
    setTimeout(poll, 1000);
}

http.createServer((req, res) => { res.write("Romantic Twin Live!"); res.end(); }).listen(process.env.PORT || 3000);
poll();
