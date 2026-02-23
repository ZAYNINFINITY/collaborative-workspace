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

    const provider = (process.env.AI_PROVIDER || "").toLowerCase();
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (!hasAnthropic && !hasOpenAI) {
      return res.status(503).json({
        msg: "AI assistant is not configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in backend environment.",
      });
    }

    const contextualMessage = context
      ? `Context:\n${context}\n\nUser:\n${message}`
      : message;

    const useAnthropic =
      provider === "anthropic" || (provider !== "openai" && hasAnthropic);

    if (useAnthropic) {
      const model =
        process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";

      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model,
          max_tokens: 1024,
          temperature: 0.3,
          system: systemPrompt,
          messages: [{ role: "user", content: contextualMessage }],
        },
        {
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const reply =
        response.data?.content
          ?.filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("\n")
          .trim() || "I could not generate a response.";

      return res.json({
        reply,
        model,
        provider: "anthropic",
        usage: response.data?.usage || null,
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
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
      provider: "openai",
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
