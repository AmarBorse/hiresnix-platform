/**
 * models/index.js — Load all models and define associations
 */

const User        = require('./User');
const Student     = require('./Student');
const Company     = require('./Company');
const Job         = require('./Job');
const Application = require('./Application');
const Internship  = require('./Internship');
const Enrollment  = require('./Enrollment');
const Resource    = require('./Resource');
const Certificate = require('./Certificate');
const Enquiry     = require('./Enquiry');
const InstitutionRequest = require('./InstitutionRequest');
const InstituteCourse = require('./InstituteCourse');
const InstituteBatch = require('./InstituteBatch');
const InstituteStudent = require('./InstituteStudent');
const InstituteAssessment = require('./InstituteAssessment');
const InstituteAssignment = require('./InstituteAssignment');
const InstituteCertificate = require('./InstituteCertificate');

// ── Associations ──────────────────────────────────────────────────

// User ↔ Student (one-to-one)
User.hasOne(Student,  { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Company (one-to-one)
User.hasOne(Company,  { foreignKey: 'userId', as: 'companyProfile', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company ↔ Job (one-to-many)
Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User ↔ Job (posted by)
User.hasMany(Job,  { foreignKey: 'postedById', as: 'postedJobs' });
Job.belongsTo(User, { foreignKey: 'postedById', as: 'postedBy' });

// Job ↔ Application (one-to-many)
Job.hasMany(Application,     { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Job,   { foreignKey: 'jobId', as: 'job' });

// Student ↔ Application (one-to-many)
Student.hasMany(Application,     { foreignKey: 'studentId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Student,   { foreignKey: 'studentId', as: 'student' });

// User ↔ Application (applied by)
User.hasMany(Application,    { foreignKey: 'appliedById', as: 'appliedApplications' });
Application.belongsTo(User,  { foreignKey: 'appliedById', as: 'appliedBy' });

// Internship associations
User.hasMany(Internship,       { foreignKey: 'createdById', as: 'createdInternships' });
Internship.belongsTo(User,     { foreignKey: 'createdById', as: 'createdBy' });
Internship.hasMany(Enrollment, { foreignKey: 'internshipId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Internship, { foreignKey: 'internshipId', as: 'internship' });
Student.hasMany(Enrollment,    { foreignKey: 'studentId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Student,  { foreignKey: 'studentId', as: 'student' });

// Certificate
Student.hasMany(Certificate,   { foreignKey: 'studentId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Enrollment.hasOne(Certificate,  { foreignKey: 'enrollmentId', as: 'certificate' });
Certificate.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

// Resource — no FK associations (standalone admin-managed)

// User ↔ InstitutionRequest (institute login account)
User.hasOne(InstitutionRequest, { foreignKey: 'userId', as: 'institutionProfile' });
InstitutionRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Institution workspace (tenant-scoped academic data)
InstitutionRequest.hasMany(InstituteCourse,     { foreignKey: 'institutionId', as: 'instituteCourses', onDelete: 'CASCADE' });
InstituteCourse.belongsTo(InstitutionRequest,   { foreignKey: 'institutionId', as: 'institution' });

InstitutionRequest.hasMany(InstituteBatch,      { foreignKey: 'institutionId', as: 'instituteBatches', onDelete: 'CASCADE' });
InstituteBatch.belongsTo(InstitutionRequest,    { foreignKey: 'institutionId', as: 'institution' });
InstituteCourse.hasMany(InstituteBatch,         { foreignKey: 'courseId', as: 'batches' });
InstituteBatch.belongsTo(InstituteCourse,       { foreignKey: 'courseId', as: 'course' });

InstitutionRequest.hasMany(InstituteStudent,    { foreignKey: 'institutionId', as: 'instituteStudents', onDelete: 'CASCADE' });
InstituteStudent.belongsTo(InstitutionRequest,  { foreignKey: 'institutionId', as: 'institution' });
InstituteBatch.hasMany(InstituteStudent,        { foreignKey: 'batchId', as: 'students' });
InstituteStudent.belongsTo(InstituteBatch,      { foreignKey: 'batchId', as: 'batch' });

InstitutionRequest.hasMany(InstituteAssessment, { foreignKey: 'institutionId', as: 'instituteAssessments', onDelete: 'CASCADE' });
InstituteAssessment.belongsTo(InstitutionRequest, { foreignKey: 'institutionId', as: 'institution' });
InstituteCourse.hasMany(InstituteAssessment,    { foreignKey: 'courseId', as: 'assessments' });
InstituteAssessment.belongsTo(InstituteCourse,  { foreignKey: 'courseId', as: 'course' });

InstitutionRequest.hasMany(InstituteAssignment, { foreignKey: 'institutionId', as: 'instituteAssignments', onDelete: 'CASCADE' });
InstituteAssignment.belongsTo(InstitutionRequest, { foreignKey: 'institutionId', as: 'institution' });
InstituteCourse.hasMany(InstituteAssignment,    { foreignKey: 'courseId', as: 'assignments' });
InstituteAssignment.belongsTo(InstituteCourse,  { foreignKey: 'courseId', as: 'course' });

InstitutionRequest.hasMany(InstituteCertificate, { foreignKey: 'institutionId', as: 'instituteCertificates', onDelete: 'CASCADE' });
InstituteCertificate.belongsTo(InstitutionRequest, { foreignKey: 'institutionId', as: 'institution' });
InstituteStudent.hasMany(InstituteCertificate,  { foreignKey: 'studentId', as: 'certificates', onDelete: 'CASCADE' });
InstituteCertificate.belongsTo(InstituteStudent, { foreignKey: 'studentId', as: 'student' });

module.exports = {
  User, Student, Company, Job, Application, Internship, Enrollment, Resource, Certificate, Enquiry,
  InstitutionRequest, InstituteCourse, InstituteBatch, InstituteStudent, InstituteAssessment, InstituteAssignment, InstituteCertificate,
};
require('./internshipPlatform');