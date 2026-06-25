// api/gemini.js
export default async function handler(req, res) {
    // Mengizinkan request hanya via POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method tidak diizinkan' });
    }

    const { userInput } = req.body;
    if (!userInput) {
        return res.status(400).json({ error: 'Input tidak boleh kosong' });
    }

    // Mengambil API Key yang disimpan aman di Vercel
    const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6INJCBnCwR_K0KfxoZiGLmAhuuwP9zPyTyfsNwnrnzdGg";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemPrompt = `Kamu adalah perwakilan pesan hati dari "Ridho" yang supportif untuk temannya.
    Berikan tanggapan yang hangat, dewasa, tulus, dan menenangkan hati. Hindari gaya bahasa yang terlalu kekanak-kanakan atau berlebihan (jangan terlalu lebay/cringe). 
    Gunakan panggilan yang lembut seperti "kamu" dengan cara yang tulus. 
    Fokuslah untuk mendengarkan keluh kesahnya, memberikan pujian yang tulus, atau menuliskan baris puisi yang menyentuh perasaan tanpa perlu memaksa menggunakan terlalu banyak emoji. 
    Bahasa harus mengalir santai tapi tetap manis dan dewasa.`;

    const payload = {
        contents: [{ parts: [{ text: userInput }] }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        }
    };

    let delay = 1000;
    const maxRetries = 3;

    // Fungsi Exponential Backoff
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP Error Status: ${response.status}`);
            }

            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text) {
                return res.status(200).json({ reply: text });
            }
            throw new Error("No text content returned");

        } catch (error) {
            if (i === maxRetries - 1) {
                return res.status(500).json({ error: error.message });
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
        }
    }
}