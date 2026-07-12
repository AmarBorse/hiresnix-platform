interface TalkingAvatarProps {
  amplitude: number   // 0-1
  isSpeaking: boolean
  isListening: boolean
  size?: number
}

export default function TalkingAvatar({
  amplitude,
  isSpeaking,
  isListening,
  size = 80,
}: TalkingAvatarProps) {
  // Mouth open height: 0 when silent, scales with amplitude
  const mouthOpen = isSpeaking ? Math.max(2, amplitude * 14) : 2
  // Eye blink every ~3s via CSS — handled by keyframe below
  const cx = size / 2
  const cy = size / 2
  const r  = size * 0.42

  // Listening: blue pulse ring; speaking: green ring; idle: gray
  const ringColor = isListening
    ? '#3b82f6'
    : isSpeaking
    ? '#22c55e'
    : '#d1d5db'

  const ringAnim = isListening || isSpeaking

  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      {/* Pulse ring */}
      {ringAnim && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${ringColor}`,
            animation: 'avatarPulse 1.2s ease-in-out infinite',
            opacity: 0.6,
          }}
        />
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
      >
        <style>{`
          @keyframes avatarPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.08);opacity:.9} }
          @keyframes blink { 0%,90%,100%{scaleY:1} 95%{scaleY:0.1} }
          .avatar-eye { transform-origin: center; animation: blink 3.5s ease-in-out infinite; }
        `}</style>

        {/* Face circle */}
        <circle
          cx={cx} cy={cy} r={r}
          fill={isListening ? '#eff6ff' : isSpeaking ? '#f0fdf4' : '#f9fafb'}
          stroke={ringColor}
          strokeWidth="1.5"
          style={{ transition: 'fill 0.3s, stroke 0.3s' }}
        />

        {/* Eyes */}
        <g className="avatar-eye">
          <ellipse cx={cx - size * 0.13} cy={cy - size * 0.1} rx={size * 0.055} ry={size * 0.065}
            fill={isListening ? '#2563eb' : isSpeaking ? '#16a34a' : '#374151'} />
          <ellipse cx={cx + size * 0.13} cy={cy - size * 0.1} rx={size * 0.055} ry={size * 0.065}
            fill={isListening ? '#2563eb' : isSpeaking ? '#16a34a' : '#374151'} />
          {/* Pupils */}
          <circle cx={cx - size * 0.13} cy={cy - size * 0.1} r={size * 0.025} fill="white" opacity="0.7" />
          <circle cx={cx + size * 0.13} cy={cy - size * 0.1} r={size * 0.025} fill="white" opacity="0.7" />
        </g>

        {/* Eyebrows */}
        <path
          d={`M ${cx - size*0.18} ${cy - size*0.21} Q ${cx - size*0.13} ${cy - size*0.25} ${cx - size*0.07} ${cy - size*0.21}`}
          fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"
        />
        <path
          d={`M ${cx + size*0.07} ${cy - size*0.21} Q ${cx + size*0.13} ${cy - size*0.25} ${cx + size*0.18} ${cy - size*0.21}`}
          fill="none" stroke="#6b7280" strokeWidth="1.2" strokeLinecap="round"
        />

        {/* Nose */}
        <path
          d={`M ${cx} ${cy + size*0.02} Q ${cx - size*0.05} ${cy + size*0.1} ${cx} ${cy + size*0.13}`}
          fill="none" stroke="#9ca3af" strokeWidth="1" strokeLinecap="round"
        />

        {/* Mouth — dynamic height based on amplitude */}
        <MouthShape
          cx={cx} cy={cy} size={size}
          openHeight={mouthOpen}
          isSpeaking={isSpeaking}
        />
      </svg>
    </div>
  )
}

function MouthShape({
  cx, cy, size, openHeight, isSpeaking,
}: {
  cx: number; cy: number; size: number; openHeight: number; isSpeaking: boolean
}) {
  const mouthY = cy + size * 0.18
  const mouthW = size * 0.22
  const mouthH = Math.max(2, openHeight)

  // Closed/smile when not speaking
  if (!isSpeaking || openHeight < 3) {
    return (
      <path
        d={`M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + size * 0.07} ${cx + mouthW} ${mouthY}`}
        fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round"
        style={{ transition: 'd 0.05s' }}
      />
    )
  }

  // Open mouth ellipse when speaking
  return (
    <ellipse
      cx={cx}
      cy={mouthY + mouthH / 2}
      rx={mouthW}
      ry={mouthH / 2}
      fill="#1f2937"
      stroke="#374151"
      strokeWidth="1"
      style={{ transition: 'ry 0.06s ease-out' }}
    >
      {/* Teeth hint */}
      <animate
        attributeName="ry"
        values={`${mouthH / 2};${Math.max(1, mouthH * 0.8) / 2};${mouthH / 2}`}
        dur="0.12s"
        repeatCount="indefinite"
      />
    </ellipse>
  )
}
