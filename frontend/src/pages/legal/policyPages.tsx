import { LegalPage, Section } from '../../components/legal/LegalPage';
import { COMPANY } from '../../lib/companyInfo';

const privacySections: Section[] = [
  { title: 'Information We Collect', body: ['We may collect name, email address, phone number, education details, resume details, company details, internship application data, job application data, document identifiers, and communication submitted through Hiresnix.', 'We may also collect technical information such as device, browser, IP address, log data, cookies, and usage analytics to secure and improve the platform.'] },
  { title: 'How We Use Information', body: ['Information is used to provide internships, recruitment services, account access, application processing, certificate and document verification, support, analytics, fraud prevention, and legal compliance.', 'We may use contact information to send transactional notices, support replies, HR communication, internship updates, and important policy changes.'] },
  { title: 'Sharing and Disclosure', body: ['We do not sell personal data. Information may be shared with verified employers, internal administrators, service providers, legal authorities, or platform partners where required for service delivery, compliance, safety, or dispute resolution.', 'Student information shared with companies is limited to recruitment and application workflows available on the platform.'] },
  { title: 'Data Rights and Retention', body: ['Users may request access, correction, or deletion of personal information by contacting support@hiresnix.co.in. Certain records may be retained where legally required or necessary for verification, audit, fraud prevention, or dispute handling.', 'We apply reasonable administrative, technical, and organizational safeguards, but no internet-based system can be guaranteed to be completely secure.'] },
];

const termsSections: Section[] = [
  { title: 'Acceptance of Terms', body: ['By accessing Hiresnix, creating an account, applying for internships or jobs, posting opportunities, or using verification services, you agree to these Terms & Conditions and applicable policies.', 'If you do not agree, you should stop using the website and services.'] },
  { title: 'User Responsibilities', body: ['Users must provide accurate information, maintain account confidentiality, avoid misuse, and comply with applicable laws. Students are responsible for completing tasks honestly and companies are responsible for posting lawful, accurate opportunities.', 'False documents, fraudulent applications, impersonation, scraping, reverse engineering, spam, or unauthorized access are prohibited.'] },
  { title: 'Platform Services', body: ['Hiresnix may provide internship programs, job listings, application workflows, resources, certificates, letters, recommendations, verification tools, and employer access. Availability of any service may change based on operational requirements.', 'Completion certificates, offer letters, or letters of recommendation are subject to eligibility, internal review, task completion, performance, and administrative approval.'] },
  { title: 'Limitation of Liability', body: ['Hiresnix makes reasonable efforts to keep information accurate and services available, but does not guarantee uninterrupted access, specific internship results, hiring outcomes, salary offers, admissions, or employment.', `To the maximum extent permitted by law, ${COMPANY.legalName} is not liable for indirect, incidental, consequential, or punitive damages arising from use of the platform.`] },
];

const disclaimerSections: Section[] = [
  { title: 'General Information', body: ['The information on Hiresnix is provided for general internship, recruitment, training, and verification purposes. While we aim to maintain accuracy, content may change without prior notice.', 'Nothing on the website should be treated as legal, financial, immigration, academic, or professional career guarantee advice.'] },
  { title: 'Internship and Hiring Outcomes', body: ['Internship participation, certification, recommendations, and job applications do not guarantee employment, stipend, placement, admission, promotion, or selection by any company.', 'Companies and students are expected to independently evaluate suitability before entering any engagement.'] },
  { title: 'Third-Party Links and Content', body: ['The website may include third-party links, resources, tools, or employer content. Hiresnix is not responsible for third-party accuracy, availability, policies, or actions.', 'Users should review third-party terms before sharing information or engaging with external services.'] },
];

const refundSections: Section[] = [
  { title: 'Refund Scope', body: ['This Refund Policy applies to paid services, if any, offered through Hiresnix. Free internship applications, free platform usage, or administrative document verification do not create any refund entitlement.', 'Where a specific paid plan, program, or service contains separate refund terms, those service-specific terms will apply.'] },
  { title: 'Non-Refundable Items', body: ['Fees may be non-refundable after access is granted to digital resources, training material, document processing, certificate generation, administrative review, or other consumed services.', 'Amounts paid to third-party providers, payment gateway charges, taxes, or statutory deductions may not be refundable unless required by law.'] },
  { title: 'Refund Requests', body: ['Refund requests must be emailed to support@hiresnix.co.in with payment proof, registered email address, reason for the request, and relevant transaction details.', 'Approved refunds, if any, will be processed to the original payment method within a reasonable period subject to banking and gateway timelines.'] },
];

const internshipSections: Section[] = [
  { title: 'Eligibility and Application', body: ['Students must submit accurate personal, academic, and contact information while applying for internship programs. Hiresnix may approve, reject, or request clarification for applications at its discretion.', 'Selected students must follow the assigned domain, schedule, task instructions, and communication guidelines shared through official channels.'] },
  { title: 'Training, Tasks, and Conduct', body: ['Interns are expected to complete assigned tasks independently, meet deadlines, maintain professional communication, and avoid plagiarism or unauthorized submission of others work.', 'Misconduct, false information, abusive behavior, repeated non-compliance, or misuse of platform resources may result in suspension or termination from the internship.'] },
  { title: 'Documents and Verification', body: ['Certificates, completion letters, offer letters, and letters of recommendation may be issued only after eligibility checks, task completion, performance review, and administrative approval.', 'Issued documents may contain unique IDs or QR-ready verification references. Hiresnix may mark documents invalid if fraud, error, revocation, or policy violation is detected.'] },
  { title: 'No Employment Guarantee', body: ['Internships are intended for learning, exposure, portfolio development, and career readiness. Participation does not guarantee employment, stipend, interview, placement, or future offer from Hiresnix or any partner company.'] },
];

export function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" eyebrow="Legal" description="This Privacy Policy explains how Hiresnix collects, uses, stores, and protects user information." path="/privacy-policy" sections={privacySections} />;
}

export function TermsAndConditions() {
  return <LegalPage title="Terms & Conditions" eyebrow="Legal" description="These Terms & Conditions govern access to and use of the Hiresnix internship and recruitment platform." path="/terms-and-conditions" sections={termsSections} />;
}

export function Disclaimer() {
  return <LegalPage title="Disclaimer" eyebrow="Legal" description="This Disclaimer explains important limits and notices related to information, internships, recruitment, and documents on Hiresnix." path="/disclaimer" sections={disclaimerSections} />;
}

export function RefundPolicy() {
  return <LegalPage title="Refund Policy" eyebrow="Legal" description="This Refund Policy explains how refund requests are reviewed for paid Hiresnix services, where applicable." path="/refund-policy" sections={refundSections} />;
}

export function InternshipPolicy() {
  return <LegalPage title="Internship Policy" eyebrow="Internship Guidelines" description="This Internship Policy outlines expected conduct, eligibility, document issuance, and completion guidelines for Hiresnix internship programs." path="/internship-policy" sections={internshipSections} />;
}
