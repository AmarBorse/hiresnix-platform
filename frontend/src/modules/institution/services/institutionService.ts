import { institutionWorkspace } from '../data/mockInstitutionData';
import { institutionsApi } from '../../../api/institutions';
import type { InstituteRequest, InstitutionWorkspace, StudentRecord } from '../types';

interface InstituteRegistrationInput {
  adminName: string;
  email: string;
  instituteName: string;
  city: string;
  phone?: string;
  website?: string;
}

/** Map a backend institution-request DTO into the frontend InstituteRequest shape. */
function mapRequest(row: any): InstituteRequest {
  return {
    id: row.id != null ? `INS-${String(row.id).padStart(4, '0')}` : String(row.name),
    requestId: typeof row.id === 'number' ? row.id : Number(row.id),
    name: row.instituteName || row.name,
    city: row.city || '—',
    contact: row.contact || row.email || '—',
    status: (row.status || 'pending') as InstituteRequest['status'],
    submittedOn: (row.submittedOn || row.createdAt || '').slice(0, 10),
    students: Number(row.students ?? 0),
    adminName: row.adminName,
    phone: row.phone ?? null,
    website: row.website ?? null,
    reviewNote: row.reviewNote ?? null,
  };
}

export const institutionService = {
  /**
   * Load the admin institution workspace. Registration requests come from the
   * live Supabase-backed API; the remaining sections still use placeholder data.
   */
  async getWorkspace(): Promise<InstitutionWorkspace> {
    try {
      const res = await institutionsApi.getRequests();
      const rows = Array.isArray(res?.data) ? res.data : [];
      return { ...institutionWorkspace, institutes: rows.map(mapRequest) };
    } catch {
      // API unavailable (offline / not authorised) — fall back to placeholder rows.
      return institutionWorkspace;
    }
  },

  async submitInstituteRegistration(input: InstituteRegistrationInput): Promise<InstituteRequest> {
    const res = await institutionsApi.register(input);
    return mapRequest(res?.data ?? {
      id: undefined,
      instituteName: input.instituteName,
      city: input.city,
      email: input.email,
      status: 'pending',
    });
  },

  async updateInstituteStatus(requestId: number, status: 'approved' | 'rejected', reviewNote?: string) {
    const res = await institutionsApi.updateStatus(requestId, status, reviewNote);
    return mapRequest(res?.data);
  },

  generateCareerId(sequence: number, year = new Date().getFullYear()) {
    return `HX-${year}-${String(sequence).padStart(6, '0')}`;
  },

  makeInternshipEligible(student: StudentRecord): StudentRecord {
    return { ...student, internshipEligible: true };
  },

  buildCertificateVerificationUrl(certificateNo: string) {
    return `/institution/verify-certificate/${encodeURIComponent(certificateNo)}`;
  },
};
