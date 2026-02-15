const fetch = require('node-fetch');
const http = require('http');

// --- CONFIGURATION ---
const TG_TOKEN = "7758188204:AAHjfAplyTvRvuyqhfbWXM2ezI2iGp5Rtk0";
const GROQ_KEY = "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";
let lastId = 0;

// --- MEMORY SYSTEM ---
let chatHistory = [
    { 
        role: "system", 
        content: "Tera naam 'Yaar Bot' hai. Tu user ka sabse jigri dost hai. Boring AI ki tarah mat bol. Ekdum short, desi aur to-the-point reply de (WhatsApp style). Agar user puche 'kaise ho' toh bas bol 'mast hoon bhai, tu bata'. Zyada gyaan mat pelna. Hinglish aur emojis ka use kar. 2 line se bada reply mat dena jab tak pucha na jaye." 
    }
];

// --- AI LOGIC ---
async function getAIReply(text) {
    // History mein naya message add karo
    chatHistory.push({ role: "user", content: text });

    // History limit (Last 12 messages) taaki bot confuse na ho
    if (chatHistory.length > 13) chatHistory.splice(1, 2);

    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${GROQ_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                model: "llama-3.3-70b-versatile", 
                messages: chatHistory,
                max_tokens: 100, // Strict limit for short replies
                temperature: 0.8 // Human-like randomness
            })
        });
        const data = await res.json();
        const aiMsg = data.choices[0].message.content;

        // AI ka reply history mein save karo
        chatHistory.push({ role: "assistant", content: aiMsg });
        return aiMsg;
    } catch (e) {
        console.log("AI Error:", e);
        return "Bhai, dimag hang ho gaya mera. Phir se bol!";
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
                    console.log("Message received:", u.message.text);
                    const reply = await getAIReply(u.message.text);
                    
                    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            chat_id: u.message.chat.id,
                            text: reply
                        })
                    });
                }
            }
        }
    } catch (e) {
        console.log("Polling Error... Retrying");
    }
    setTimeout(poll, 1000);
}

// --- SERVER TO KEEP ALIVE ---
http.createServer((req, res) => {
    res.write("Yaar Bot is Online and Chilling!");
    res.end();
}).listen(process.env.PORT || 3000);

console.log("Bot started successfully...");
poll();
