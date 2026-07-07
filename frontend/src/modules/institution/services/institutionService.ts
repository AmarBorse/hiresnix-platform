import { institutionWorkspace } from '../data/mockInstitutionData';
import type { InstituteRequest, StudentRecord } from '../types';

const wait = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms));
const institutionRequestsKey = 'hiresnix:institution-registration-requests';

interface InstituteRegistrationInput {
  adminName: string;
  email: string;
  instituteName: string;
  city: string;
}

function readStoredInstituteRequests(): InstituteRequest[] {
  try {
    const stored = window.localStorage.getItem(institutionRequestsKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export const institutionService = {
  async getWorkspace() {
    await wait();
    return {
      ...institutionWorkspace,
      institutes: [...readStoredInstituteRequests(), ...institutionWorkspace.institutes],
    };
  },

  async submitInstituteRegistration(input: InstituteRegistrationInput) {
    await wait();
    const request: InstituteRequest = {
      id: `INS-${Date.now().toString().slice(-6)}`,
      name: input.instituteName,
      city: input.city,
      contact: input.email,
      status: 'pending',
      submittedOn: new Date().toISOString().slice(0, 10),
      students: 0,
    };
    const requests = [request, ...readStoredInstituteRequests()];
    window.localStorage.setItem(institutionRequestsKey, JSON.stringify(requests));
    return request;
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
