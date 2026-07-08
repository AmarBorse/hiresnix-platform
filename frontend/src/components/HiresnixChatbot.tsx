// src/components/HiresnixChatbot.tsx
// Manually trained keyword-based chatbot — no API needed

import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, Bot, Send } from 'lucide-react';

interface Message { from: 'bot' | 'user'; text: string; }

// ── Knowledge Base ────────────────────────────────────────────────
const KB: { keys: string[]; answer: string }[] = [
  {
    keys: ['apply', 'register', 'kaise apply', 'registration', 'join', 'start', 'enroll', 'sign up', 'signup', 'kaise kare', 'kaise kru'],
    answer: `📝 **Hiresnix me apply karna bahut aasaan hai!**

1. hiresnix.co.in pe jao
2. "Get Started" ya "Register" pe click karo
3. Student account banao (free hai)
4. Login karo → Hiresnix Intern → Domain choose karo
5. Application submit karo
6. Admin approve karega → Training shuru! 🚀

Koi problem ho toh contact karo: 9529120977`,
  },
  {
    keys: ['fee', 'fees', 'charge', 'charges', 'kitna', 'price', 'cost', 'paid', 'free', 'paise', 'paisa', 'money', 'payment'],
    answer: `✅ **Hiresnix bilkul FREE hai!**

- Registration: FREE
- Internship Training: FREE  
- Certificate: FREE
- LOR (Letter of Recommendation): FREE

Koi hidden charges nahi hain. 😊`,
  },
  {
    keys: ['domain', 'domains', 'course', 'courses', 'field', 'konsa', 'which', 'subject', 'technology', 'tech', 'stream'],
    answer: `💻 **Hiresnix ke Available Domains:**

• Web Development (React, Node.js)
• AI / Machine Learning (Python, TensorFlow)
• Data Science (Python, SQL)
• Data Analyst
• Front End Developer
• App Development (React Native)
• UI/UX Design (Figma)
• Cloud Computing & DevOps (AWS, Docker)
• Artificial Intelligence
• Machine Learning (ML)
• And more! 🎯

Duration: 6 Months`,
  },
  {
    keys: ['certificate', 'cert', 'certification', 'certified', 'milega', 'kab milega', 'completion'],
    answer: `🏆 **Certificate kaise milega?**

1. 6 month internship complete karo
2. Weekly tasks submit karo
3. Admin Mark Complete karega
4. Certificate automatically generate hoga ✅

Certificate me hoga:
• Unique Certificate ID
• QR Verification Code
• PDF Download
• Verify at: hiresnix.co.in/verify`,
  },
  {
    keys: ['lor', 'letter of recommendation', 'recommendation', 'letter', 'recommendation letter'],
    answer: `📄 **LOR (Letter of Recommendation) kya hai?**

LOR ek official letter hota hai jo Hiresnix tumhari internship performance ke baare me deta hai.

**Kab milega:**
• Internship successfully complete karne ke baad
• Admin review ke baad issue hota hai

**Kaam aata hai:**
• MBA/Higher studies applications me
• Job interviews me
• Portfolio me add karne ke liye 💼`,
  },
  {
    keys: ['duration', 'kitne din', 'kitne month', 'how long', 'time', 'weeks', 'month', 'mahine', 'period', '6 month', 'tenure'],
    answer: `⏱️ **Internship Duration:**

**6 Months** (All domains)

• Weekly tasks aur assignments
• Resources aur study material milega
• Progress track hoga (0% → 100%)
• Apni pace se complete karo 📚`,
  },
  {
    keys: ['contact', 'phone', 'number', 'call', 'whatsapp', 'email', 'reach', 'helpline', 'support', 'help'],
    answer: `📞 **Hiresnix Contact Details:**

📱 Phone / WhatsApp: **9529120977**
📧 Email: **hr@hiresnix.co.in**
🌐 Website: **hiresnix.co.in**
📍 Location: Shirpur, Maharashtra

Hum usually **10 AM – 6 PM** available rehte hain. 😊`,
  },
  {
    keys: ['institution', 'college', 'tieup', 'tie up', 'tie-up', 'partner', 'partnership', 'school', 'university', 'mou', 'collaboration', 'institute'],
    answer: `🏫 **Institution Tieup with Hiresnix:**

**Kya milta hai institutions ko:**
• Hiresnix Partner Institution badge ✅
• Students ko Career ID (HX-2026-XXXXXX)
• Student management portal (batch, courses, certificates)
• Bulk student enrollment
• Institution branded certificates

**Tieup process:**
1. hiresnix.co.in pe Institution account register karo
2. Admin review karega
3. Approval ke baad portal access milega
4. Students add karo → Batches → Courses → Certificates

**Contact for Tieup:**
📱 9529120977 | 📧 hr@hiresnix.co.in`,
  },
  {
    keys: ['career id', 'careerid', 'hx', 'id kya', 'unique id', 'student id', 'hiresnix id'],
    answer: `🎯 **Hiresnix Career ID kya hai?**

Career ID ek unique identity number hai jo Partner Institution ke students ko milta hai.

**Format:** HX-2026-000001

**Fayde:**
• Institution student portal login ke liye
• Certificates me mention hota hai
• Lifetime valid hai
• Partner institution students ko internship benefits 🌟

Career ID sirf approved Hiresnix Partner Institutions ke students ko milti hai.`,
  },
  {
    keys: ['job', 'jobs', 'placement', 'placed', 'naukri', 'company', 'companies', 'hiring', 'recruit', 'work', 'opportunity'],
    answer: `💼 **Jobs at Hiresnix:**

1. hiresnix.co.in pe login karo
2. **Jobs** section me jao
3. Available jobs browse karo
4. Apply karo — resume upload karo
5. Company shortlist karegi → Interview 🎉

**Company ke liye:**
Companies Hiresnix pe free me jobs post kar sakti hain aur students se direct connect kar sakti hain.

For jobs: hr@hiresnix.co.in | 9529120977`,
  },
  {
    keys: ['consultancy', 'consulting', 'service', 'services', 'kya karta', 'kya offer', 'business', 'what do you do'],
    answer: `🏢 **Hiresnix Services:**

**Students ke liye:**
• Free Internship Training (6 months)
• Certificates & LOR
• Job Portal
• Career guidance

**Institutions ke liye:**
• Institution Tieup & Partnership
• Student management portal
• Batch & Course management
• Certified career IDs for students

**Companies ke liye:**
• Job posting platform
• Student recruitment
• Placement support

📱 9529120977 | 📧 hr@hiresnix.co.in`,
  },
];

const GREETINGS = ['hi', 'hello', 'hey', 'hii', 'helo', 'namaste', 'namaskar', 'good morning', 'good evening', 'good afternoon', 'helo', 'hye'];
const THANKS    = ['thanks', 'thank you', 'thankyou', 'thank', 'shukriya', 'dhanyawad', 'ok thanks', 'ok', 'great', 'nice', 'awesome', 'perfect'];

function getReply(input: string): string {
  const q = input.toLowerCase().trim();

  if (GREETINGS.some(g => q.includes(g))) {
    return "Hello! 👋 Main Hiresnix AI Assistant hoon. Aap internship, certificate, domains, ya kisi bhi cheez ke baare me pooch sakte hain!";
  }
  if (THANKS.some(t => q === t || q.startsWith(t))) {
    return "You're welcome! 😊 Koi aur question ho toh zaroor poochein. All the best! 🌟";
  }

  // Score each KB entry
  let best = { score: 0, answer: '' };
  for (const entry of KB) {
    const score = entry.keys.filter(k => q.includes(k)).length;
    if (score > best.score) best = { score, answer: entry.answer };
  }

  if (best.score > 0) return best.answer;

  return `Hmm, mujhe is sawaal ka jawab nahi pata. 🤔

Please contact karo:
📱 **9529120977** (WhatsApp/Call)
📧 **hr@hiresnix.co.in**
🌐 **hiresnix.co.in**

Ya in topics me se kuch poochho:
• Apply kaise kare
• Fees / Charges
• Domains / Courses
• Certificate
• Duration
• Institution Tieup`;
}

const QUICK_Q = [
  { label: '📝 Apply kaise kare?', q: 'How to apply?' },
  { label: '💰 Fees kitni hai?',   q: 'fees kitni hai' },
  { label: '💻 Konse domains?',    q: 'konse domains hain' },
  { label: '🏆 Certificate?',      q: 'certificate kab milega' },
  { label: '🏫 Institution tieup', q: 'institution tieup kaise hota hai' },
  { label: '📞 Contact',           q: 'contact number kya hai' },
];

export function HiresnixChatbot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: "Namaste! 🙏 Main Hiresnix AI Assistant hoon.\n\nInternship, certificate, domains, ya kisi bhi cheez ke baare me poochh sakte hain! Neeche se topic choose karo ya khud type karo 👇" }
  ]);
  const [input, setInput]   = useState('');
  const [unread, setUnread] = useState(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 150); }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { from: 'user', text: text.trim() };
    const reply = getReply(text);
    setMessages(prev => [...prev, userMsg, { from: 'bot', text: reply }]);
    setInput('');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  // Render text with basic **bold** support
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <>
      <style>{`
        @keyframes chatIn  { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes spinAnim{ to{transform:rotate(360deg)} }
        .hx-chat-msgs::-webkit-scrollbar { width: 4px; }
        .hx-chat-msgs::-webkit-scrollbar-track { background: transparent; }
        .hx-chat-msgs::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      {/* Chat Window */}
      {open && (
        <div style={{ position:'fixed', bottom:90, right:24, zIndex:9999, width:340, maxHeight:520, background:'#0f172a', borderRadius:20, boxShadow:'0 25px 60px rgba(0,0,0,0.6)', border:'1px solid rgba(99,102,241,0.25)', display:'flex', flexDirection:'column', overflow:'hidden', animation:'chatIn 0.2s ease' }}>

          {/* Header */}
          <div style={{ background:'linear-gradient(135deg,#4f46e5,#7c3aed)', padding:'14px 16px', display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bot size={18} color="white" />
            </div>
            <div style={{ flex:1 }}>
              <p style={{ color:'white', fontWeight:700, fontSize:14, margin:0 }}>Hiresnix AI</p>
              <p style={{ color:'rgba(255,255,255,0.75)', fontSize:11, margin:0, display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', display:'inline-block' }} />
                Online · Instant replies
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.7)', padding:4, borderRadius:8, display:'flex' }}>
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="hx-chat-msgs" style={{ flex:1, overflowY:'auto', padding:'14px', display:'flex', flexDirection:'column', gap:10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user' ? 'flex-end' : 'flex-start', gap:8, alignItems:'flex-end' }}>
                {m.from==='bot' && (
                  <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginBottom:2 }}>
                    <Bot size={13} color="white" />
                  </div>
                )}
                <div style={{ maxWidth:'80%', padding:'10px 13px', borderRadius: m.from==='user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px', background: m.from==='user' ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.07)', color:'white', fontSize:13, lineHeight:1.6, border: m.from==='bot' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions — show when only 1 message */}
          {messages.length <= 1 && (
            <div style={{ padding:'0 12px 10px', display:'flex', flexWrap:'wrap', gap:6, flexShrink:0 }}>
              {QUICK_Q.map(q => (
                <button key={q.q} onClick={() => send(q.q)}
                  style={{ background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', borderRadius:20, padding:'5px 11px', color:'#a5b4fc', fontSize:11, cursor:'pointer', fontWeight:500, transition:'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(99,102,241,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.background='rgba(99,102,241,0.15)')}>
                  {q.label}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding:'10px 12px 14px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Kuch bhi poochho..."
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'9px 13px', color:'white', fontSize:13, outline:'none' }} />
            <button onClick={() => send(input)} disabled={!input.trim()}
              style={{ width:40, height:40, borderRadius:12, background: input.trim() ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'rgba(255,255,255,0.05)', border:'none', cursor: input.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
              <Send size={16} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ position:'fixed', bottom:24, right:24, zIndex:9999, width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#7c3aed)', border:'none', cursor:'pointer', boxShadow:'0 8px 32px rgba(99,102,241,0.55)', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.2s, box-shadow 0.2s' }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform='scale(1.1)'; el.style.boxShadow='0 12px 40px rgba(99,102,241,0.7)'; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform='scale(1)'; el.style.boxShadow='0 8px 32px rgba(99,102,241,0.55)'; }}>
        {open ? <X size={23} color="white" /> : <MessageCircle size={23} color="white" />}
        {!open && unread > 0 && (
          <div style={{ position:'absolute', top:-3, right:-3, width:20, height:20, borderRadius:'50%', background:'#ef4444', color:'white', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2.5px solid #0f172a', animation:'pulse 2s infinite' }}>
            {unread}
          </div>
        )}
      </button>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }`}</style>
    </>
  );
}