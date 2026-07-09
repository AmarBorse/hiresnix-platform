// routes/chatbotRoutes.js
const express      = require('express');
const asyncHandler = require('express-async-handler');
const axios        = require('axios');
const r            = express.Router();

const SYSTEM_PROMPT = `You are Hiresnix AI Assistant — a friendly helpful chatbot for hiresnix.co.in.

About Hiresnix:
- Hiresnix connects students with real internship training programs and startup job opportunities
- Students get Certificates, LORs (Letter of Recommendation), and career support
- Domains: Web Development, AI/ML, Data Science, App Development, UI/UX Design, Cloud & DevOps, Front End Developer, Machine Learning, Artificial Intelligence, Data Analyst, Cloud Computing and more
- Internship duration: 6-10 weeks depending on domain
- Students submit weekly tasks and track progress
- After completion: Certificate + Completion Letter + LOR as PDF downloads
- Registration is FREE for students
- Contact: hr@hiresnix.co.in | Phone: 9322690710
- Institution students get a unique Career ID (HX-YYYY-XXXXXX)
- Partner institution students eligible for internship enrollment benefits

Rules:
- Be friendly, concise, 2-4 lines max
- Answer in same language as user (Hindi/Hinglish/English)
- If unsure, say contact hr@hiresnix.co.in
- Use emojis occasionally
- Never make up information`;

r.post('/chat', asyncHandler(async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    res.status(400); throw new Error('Messages required');
  }

  const response = await axios.post('https://api.anthropic.com/v1/messages', {
    model:      'claude-sonnet-4-6',
    max_tokens: 300,
    system:     SYSTEM_PROMPT,
    messages:   messages.slice(-10), // last 10 messages for context
  }, {
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
  });

  const reply = response.data?.content?.[0]?.text || "Please contact hr@hiresnix.co.in 😊";
  res.json({ success: true, reply });
}));

module.exports = r;
