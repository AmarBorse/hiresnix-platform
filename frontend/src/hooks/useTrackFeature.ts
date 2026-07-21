// src/hooks/useTrackFeature.ts
// Simple hook to track feature usage — fire and forget

const API = (import.meta as any).env?.VITE_API_URL || 'https://hirenix-backend.onrender.com/api';

export function trackFeature(feature: string, action: string = 'view', metadata: Record<string, any> = {}) {
  try {
    const token = localStorage.getItem('hx_student_token') || localStorage.getItem('hx_institution_token') || localStorage.getItem('hirenix_token');
    if (!token) return;
    fetch(`${API}/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ feature, action, metadata }),
    }).catch(() => {}); // silent fail
  } catch {}
}
