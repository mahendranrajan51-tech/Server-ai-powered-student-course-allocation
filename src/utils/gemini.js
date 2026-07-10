const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function askGemini(prompt) {
    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt
        });

        return response.text;

    } catch (err) {

        console.log(err);

        console.log(err.status);

        console.log(err.message);

        console.log(err.stack);

        throw err;
    }
}

module.exports = { askGemini }