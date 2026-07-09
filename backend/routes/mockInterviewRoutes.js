// routes/mockInterviewRoutes.js
const express      = require('express');
const asyncHandler = require('express-async-handler');
const axios        = require('axios');
const r            = express.Router();

const SYSTEM_PROMPT = `You are an expert technical interviewer conducting a mock interview.
Your role is to:
1. Ask ONE clear technical question at a time
2. Evaluate the candidate's answer
3. Give a score out of 10
4. Provide constructive feedback
5. Ask the next question

Always respond in this exact JSON format:
{
  "feedback": "Your feedback on the previous answer (empty string for first question)",
  "score": 0,
  "nextQuestion": "Your next interview question here",
  "isComplete": false
}

When interview is complete after 5 questions, set isComplete to true.
Keep questions relevant to the selected domain. Be encouraging but honest.`;

r.post('/chat', asyncHandler(async (req, res) => {
  const { messages, domain } = req.body;
  if (!messages) { res.status(400); throw new Error('Messages required'); }

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT + `\nDomain: ${domain || 'Full Stack'}` }] },
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
    }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const clean = text.replace(/```json\n?|\n?```/g, '').trim();
  let parsed;
  try { parsed = JSON.parse(clean); }
  catch { parsed = { feedback: '', score: 0, nextQuestion: text, isComplete: false }; }

  res.json({ success: true, data: parsed });
}));

module.exports = r;