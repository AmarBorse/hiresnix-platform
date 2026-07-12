import { jsPDF } from 'jspdf'
import { supabase } from '../../lib/supabaseClient'
import { getCertificate } from '../../lib/academy/academySupabase'

export interface CertificateData {
  studentName: string
  courseTitle: string
  completionDate: string   // formatted string
  verifyHash: string
  certificateId: string
}

// ── Generate a short unique hash ─────────────────────────────

export function generateVerifyHash(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  const array = new Uint8Array(10)
  crypto.getRandomValues(array)
  array.forEach(b => { result += chars[b % chars.length] })
  // Format: XXXX-XXXX-XX
  return `${result.slice(0, 4)}-${result.slice(4, 8)}-${result.slice(8, 10)}`
}

// ── Build PDF using jsPDF ─────────────────────────────────────

export function generateCertificatePDF(data: CertificateData): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  const W = 297  // A4 landscape width
  const H = 210  // A4 landscape height

  // ── Background ───────────────────────────────────────────
  // Dark navy background
  doc.setFillColor(10, 15, 40)
  doc.rect(0, 0, W, H, 'F')

  // ── Outer gold border ─────────────────────────────────────
  doc.setDrawColor(212, 175, 55)   // gold
  doc.setLineWidth(0.8)
  doc.rect(8, 8, W - 16, H - 16, 'S')

  // Inner thin border
  doc.setLineWidth(0.3)
  doc.setDrawColor(180, 140, 30)
  doc.rect(11, 11, W - 22, H - 22, 'S')

  // ── Header bar ────────────────────────────────────────────
  doc.setFillColor(18, 28, 70)
  doc.rect(0, 0, W, 38, 'F')

  // Header bottom gold line
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.5)
  doc.line(8, 38, W - 8, 38)

  // ── Company name (header) ─────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(212, 175, 55)
  doc.text('SR PATIL INFRASTRUCTURE PRIVATE LIMITED', W / 2, 14, { align: 'center' })

  // Platform name
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(160, 170, 200)
  doc.text('HIRESNIX AI ACADEMY  ·  hiresnix.co.in', W / 2, 21, { align: 'center' })

  // Tagline
  doc.setFontSize(7)
  doc.setTextColor(120, 130, 160)
  doc.text('Empowering India\'s Next Generation of Tech Professionals', W / 2, 28, { align: 'center' })

  // ── Corner decorations (gold circles) ─────────────────────
  const corners = [[20, 20], [W - 20, 20], [20, H - 20], [W - 20, H - 20]] as [number, number][]
  doc.setFillColor(212, 175, 55)
  corners.forEach(([x, y]) => {
    doc.circle(x, y, 3, 'F')
    doc.setDrawColor(212, 175, 55)
    doc.setLineWidth(0.3)
    doc.circle(x, y, 5, 'S')
  })

  // ── "Certificate of Completion" title ─────────────────────
  doc.setFont('times', 'italic')
  doc.setFontSize(11)
  doc.setTextColor(160, 170, 200)
  doc.text('Certificate of Completion', W / 2, 54, { align: 'center' })

  // Decorative lines flanking title
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.4)
  doc.line(40, 54, 100, 54)
  doc.line(W - 100, 54, W - 40, 54)

  // ── "This is to certify" ──────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(160, 170, 200)
  doc.text('This is to certify that', W / 2, 70, { align: 'center' })

  // ── Student name ──────────────────────────────────────────
  doc.setFont('times', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(data.studentName, W / 2, 88, { align: 'center' })

  // Underline below name
  const nameWidth = doc.getTextWidth(data.studentName)
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.5)
  doc.line(W / 2 - nameWidth / 2, 92, W / 2 + nameWidth / 2, 92)

  // ── "has successfully completed" ─────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(160, 170, 200)
  doc.text('has successfully completed the course', W / 2, 103, { align: 'center' })

  // ── Course title ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.setTextColor(212, 175, 55)
  doc.text(data.courseTitle, W / 2, 117, { align: 'center' })

  // ── "on Hiresnix AI Academy" ──────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(120, 130, 160)
  doc.text('on Hiresnix AI Academy, powered by AI-driven interactive learning', W / 2, 128, { align: 'center' })

  // ── Footer bar ────────────────────────────────────────────
  doc.setFillColor(18, 28, 70)
  doc.rect(0, H - 42, W, 42, 'F')
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.4)
  doc.line(8, H - 42, W - 8, H - 42)

  // ── Signatures section ────────────────────────────────────
  const sigY = H - 28

  // Left signature: Date
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(212, 175, 55)
  doc.text(data.completionDate, 60, sigY, { align: 'center' })
  doc.setDrawColor(180, 140, 30)
  doc.setLineWidth(0.3)
  doc.line(30, sigY + 2, 90, sigY + 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 130, 160)
  doc.text('Date of Completion', 60, sigY + 7, { align: 'center' })

  // Center: Seal placeholder
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.5)
  doc.circle(W / 2, sigY - 2, 12, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(212, 175, 55)
  doc.text('HIRESNIX', W / 2, sigY - 4, { align: 'center' })
  doc.text('AI ACADEMY', W / 2, sigY, { align: 'center' })
  doc.setFontSize(5)
  doc.setTextColor(120, 130, 160)
  doc.text('VERIFIED', W / 2, sigY + 4, { align: 'center' })

  // Right signature: Director
  doc.setFont('times', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(212, 175, 55)
  doc.text('SR Patil', W - 60, sigY - 4, { align: 'center' })
  doc.setDrawColor(180, 140, 30)
  doc.setLineWidth(0.3)
  doc.line(W - 90, sigY + 2, W - 30, sigY + 2)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120, 130, 160)
  doc.text('Director, SR Patil Infrastructure Pvt Ltd', W - 60, sigY + 7, { align: 'center' })
  doc.text('Shirpur, Maharashtra', W - 60, sigY + 12, { align: 'center' })

  // ── Verify hash (bottom strip) ────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(80, 90, 120)
  doc.text(
    `Certificate ID: ${data.verifyHash}  ·  Verify at: hiresnix.co.in/verify/${data.verifyHash}`,
    W / 2, H - 5, { align: 'center' }
  )

  return doc
}

// ── Upload PDF to Supabase Storage ───────────────────────────

export async function uploadCertificatePDF(
  userId: string,
  courseId: string,
  pdfBlob: Blob
): Promise<string> {
  const path = `certificates/${userId}/${courseId}.pdf`

  const { error } = await supabase.storage
    .from('academy-certificates')
    .upload(path, pdfBlob, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage
    .from('academy-certificates')
    .getPublicUrl(path)

  return data.publicUrl
}

// ── Save certificate record to DB ────────────────────────────

export async function saveCertificateRecord(
  userId: string,
  courseId: string,
  verifyHash: string,
  pdfUrl: string
): Promise<void> {
  const { error } = await supabase.from('certificates').upsert(
    {
      user_id: userId,
      course_id: courseId,
      verify_hash: verifyHash,
      pdf_url: pdfUrl,
      issued_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,course_id' }
  )
  if (error) throw new Error(`Failed to save certificate: ${error.message}`)
}

// ── Check if course is complete + issue certificate ───────────

export async function checkAndIssueCertificate(
  userId: string,
  courseId: string,
  studentName: string,
  courseTitle: string
): Promise<{ issued: boolean; pdfUrl: string; verifyHash: string } | null> {
  // Check if certificate already exists
  const existing = await getCertificate(userId, courseId)
  if (existing) {
    return {
      issued: false,
      pdfUrl: existing.pdf_url ?? '',
      verifyHash: existing.verify_hash,
    }
  }

  // Check if all lessons completed
  const { data: modules } = await supabase
    .from('modules')
    .select('lessons(id)')
    .eq('course_id', courseId)

  const allLessonIds: string[] = (modules ?? [])
    .flatMap((m: { lessons: { id: string }[] }) => m.lessons ?? [])
    .map((l: { id: string }) => l.id)

  if (allLessonIds.length === 0) return null

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('lesson_id', allLessonIds)

  const completedCount = (progress ?? []).length
  if (completedCount < allLessonIds.length) return null

  // All lessons complete — issue certificate
  const verifyHash = generateVerifyHash()
  const completionDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const pdf = generateCertificatePDF({
    studentName,
    courseTitle,
    completionDate,
    verifyHash,
    certificateId: verifyHash,
  })

  const pdfBlob = pdf.output('blob')
  const pdfUrl  = await uploadCertificatePDF(userId, courseId, pdfBlob)
  await saveCertificateRecord(userId, courseId, verifyHash, pdfUrl)

  return { issued: true, pdfUrl, verifyHash }
}
