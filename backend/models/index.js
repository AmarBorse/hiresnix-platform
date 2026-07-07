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

module.exports = { User, Student, Company, Job, Application, Internship, Enrollment, Resource, Certificate, Enquiry, InstitutionRequest };
require('./internshipPlatform');