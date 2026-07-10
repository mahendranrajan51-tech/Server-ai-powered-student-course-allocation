const { askGemini } = require("../utils/gemini");

const detectIntent = async (question) => {

    const prompt = `
You are an intent classifier.

Possible intents:

allocation_count
missed_first_preference
highest_rejection
category_summary

Only return ONE WORD.

Question:
${question}
`;

    const intent = await askGemini(prompt);

    return intent.trim().toLowerCase();
};

module.exports = { detectIntent }