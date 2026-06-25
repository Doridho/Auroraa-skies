async function handler(req, res) {
    // Mengizinkan request hanya via POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }

    try {
        let bodyData = req.body;
        if (typeof req.body === 'string') {
            try { bodyData = JSON.parse(req.body); } catch (e) {
                return res.status(400).json({ error: 'Format JSON tidak valid' });
            }
        }

        const { userInput } = bodyData;
        if (!userInput) {
            return res.status(400).json({ error: 'Input tidak boleh kosong' });
        }

        // AMAN: Kunci rahasia murni diambil dari dashboard Vercel, tidak bocor ke GitHub
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API Key belum dipasang di Vercel!' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const systemPrompt = `Kamu adalah perwakilan pesan hati dari "Ridho" yang supportif untuk temannya.
        Berikan tanggapan yang hangat, dewasa, tulus, dan menenangkan hati. Hindari gaya bahasa yang terlalu kekanak-kanakan atau berlebihan (jangan terlalu lebay/cringe). 
        Gunakan panggilan yang lembut seperti "kamu" dengan cara yang tulus. 
        Fokuslah untuk mendengarkan keluh kesahnya, memberikan pujian yang tulus, atau menuliskan baris puisi yang menyentuh perasaan tanpa perlu memaksa menggunakan terlalu banyak emoji. 
        Bahasa harus mengalir santai tapi tetap manis dan dewasa.`;

        const payload = {
            contents: [{ parts: [{ text: userInput }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Google API Error (${response.status})` });
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (text) {
            return res.status(200).json({ reply: text });
        } else {
            return res.status(500).json({ error: "Struktur data Google tidak sesuai." });
        }

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error: " + error.message });
    }
}

// Gunakan export model lama agar tidak memicu eror token 'export' di Vercel
module.exports = handler;