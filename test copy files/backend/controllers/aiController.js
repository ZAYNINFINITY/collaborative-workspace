const axios = require("axios");

const systemPrompt = `You are the AI assistant for a collaborative workspace app.
Be concise, practical, and accurate.
When code-related, provide actionable steps.
If information is missing, ask one clarifying question.`;

exports.chat = async (req, res) => {
  try {
    const { message, context } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ msg: "Message is required" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        msg: "AI assistant is not configured. Set OPENAI_API_KEY in backend environment.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const contextualMessage = context
      ? `Context:\n${context}\n\nUser:\n${message}`
      : message;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: contextualMessage },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    const reply =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "I could not generate a response.";

    return res.json({
      reply,
      model,
      usage: response.data?.usage || null,
    });
  } catch (err) {
    const status = err.response?.status;
    const detail =
      err.response?.data?.error?.message || err.message || "AI request failed";

    return res.status(status || 500).json({
      msg: "AI response failed",
      detail,
    });
  }
};

