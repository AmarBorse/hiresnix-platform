const express = require('express');
const { protect } = require('../middleware/auth');

const r = express.Router();

// All Groq calls proxied through backend
// GROQ_API_KEY is stored ONLY in backend .env - never exposed to frontend
r.post('/chat', protect, async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens, system } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) return res.status(500).json({ error: 'Groq not configured' });

    const payload = {
      model: model || 'llama-3.3-70b-versatile',
      max_tokens: Math.min(max_tokens || 1000, 2000), // cap at 2000
      temperature: temperature || 0.7,
      messages: system
        ? [{ role: 'system', content: system }, ...messages]
        : messages,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    res.json({ content: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('Groq proxy error:', err.message);
    res.status(500).json({ error: 'Groq request failed' });
  }
});

module.exports = r;
