const fetch = require('node-fetch');
const http = require('http');

// --- CONFIGURATION ---
const TG_TOKEN = "7758188204:AAHjfAplyTvRvuyqhfbWXM2ezI2iGp5Rtk0";
const GROQ_KEY = "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"; // Nayi Key Updated
let lastId = 0;
let userMemories = {}; 

// --- AI LOGIC WITH PERSONALITY ---
async function getAIReply(chatId, userName, text) {
    if (!userMemories[chatId]) {
        userMemories[chatId] = [
            { 
                role: "system", 
                content: `Tera naam 'Yaar Bot' hai aur tu Losting ka Digital Twin hai.
                Teri personality user ke tone par depend karti hai:

                1. **ROMANTIC MODE**: Agar samne wali ladki tujhe 'Babu', 'Shona', 'Jaan', 'Love' bole ya romantic/sweet baatein kare, toh ekdum Romeo ban ja. Sweetly aur romantically baat kar, thoda flirt kar, 'Baby' ya 'Jaan' bol.
                
                2. **DOST MODE**: Agar koi dost 'Bhai', 'Abe', 'Oye' bole, toh ekdum desi bakchodi kar. 'Kaisan ba', 'Badhiya re', 'Jhingur' jaise words use kar aur mazaak uda. 

                **Strict Rules**:
                - Replies ekdum short (1-2 lines) aur desi Hinglish mein rakh.
                - Zyada gyaan ya AI wali baatein mat kar.
                - Bilkul insaan ki tarah behave kar.`
            }
        ];
    }

    let history = userMemories[chatId];
    history.push({ role: "user", content: text });

    if (history.length > 11) history.splice(1, 2);

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${GROQ_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                model: "llama-3.1-8b-instant", // High speed & High limit model
                messages: history,
                max_tokens: 100, 
                temperature: 0.9 
            })
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.log("API Error:", errorData);
            throw new Error("API Limit");
        }

        const data = await res.json();
        const aiMsg = data.choices[0].message.content;
        history.push({ role: "assistant", content: aiMsg });
        return aiMsg;
    } catch (e) { 
        console.log("Error:", e);
        return "Bhai, piche se system thoda slow hai, 2 minute baad try kar!"; 
    }
}

// --- TELEGRAM POLLING ---
async function poll() {
    try {
        const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/getUpdates?offset=${lastId + 1}&timeout=30`);
        const data = await res.json();
        
        if (data.result && data.result.length > 0) {
            for (let u of data.result) {
                lastId = u.update_id;
                if (u.message && u.message.text) {
                    const chatId = u.message.chat.id;
                    const name = u.message.from.first_name || "Bhai";
                    const reply = await getAIReply(chatId, name, u.message.text);
                    
                    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: chatId, text: reply })
                    });
                }
            }
        }
    } catch (e) {
        console.log("Polling Error...");
    }
    setTimeout(poll, 1000);
}

// --- KEEP ALIVE SERVER ---
http.createServer((req, res) => {
    res.write("Twin Bot is Active!");
    res.end();
}).listen(process.env.PORT || 3000);

console.log("Bot started with New Key...");
poll();
