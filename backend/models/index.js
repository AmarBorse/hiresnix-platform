/**
 * models/index.js — Load all models and define associations
 */

const User                   = require('./User');
const Student                = require('./Student');
const Company                = require('./Company');
const Job                    = require('./Job');
const Application            = require('./Application');
const Internship             = require('./Internship');
const Enrollment             = require('./Enrollment');
const Resource               = require('./Resource');
const Certificate            = require('./Certificate');
const Enquiry                = require('./Enquiry');
const Institution            = require('./Institution');
const InstitutionStudent     = require('./InstitutionStudent');
const Batch                  = require('./Batch');
const BatchStudent           = require('./BatchStudent');
const Course                 = require('./Course');
const CourseStudent          = require('./CourseStudent');
const InstitutionCertificate = require('./InstitutionCertificate');

// ── Existing Associations (unchanged) ────────────────────────────

User.hasOne(Student,  { foreignKey: 'userId', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Company,  { foreignKey: 'userId', as: 'companyProfile', onDelete: 'CASCADE' });
Company.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

User.hasMany(Job,  { foreignKey: 'postedById', as: 'postedJobs' });
Job.belongsTo(User, { foreignKey: 'postedById', as: 'postedBy' });

Job.hasMany(Application,     { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Job,   { foreignKey: 'jobId', as: 'job' });

Student.hasMany(Application,     { foreignKey: 'studentId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Student,   { foreignKey: 'studentId', as: 'student' });

User.hasMany(Application,    { foreignKey: 'appliedById', as: 'appliedApplications' });
Application.belongsTo(User,  { foreignKey: 'appliedById', as: 'appliedBy' });

User.hasMany(Internship,       { foreignKey: 'createdById', as: 'createdInternships' });
Internship.belongsTo(User,     { foreignKey: 'createdById', as: 'createdBy' });
Internship.hasMany(Enrollment, { foreignKey: 'internshipId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Internship, { foreignKey: 'internshipId', as: 'internship' });
Student.hasMany(Enrollment,    { foreignKey: 'studentId', as: 'enrollments', onDelete: 'CASCADE' });
Enrollment.belongsTo(Student,  { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Certificate,   { foreignKey: 'studentId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Enrollment.hasOne(Certificate,  { foreignKey: 'enrollmentId', as: 'certificate' });
Certificate.belongsTo(Enrollment, { foreignKey: 'enrollmentId', as: 'enrollment' });

// ── Institution Associations (NEW) ───────────────────────────────

User.hasOne(Institution, { foreignKey: 'userId', as: 'institutionProfile', onDelete: 'CASCADE' });
Institution.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Institution.hasMany(InstitutionStudent, { foreignKey: 'institutionId', as: 'students', onDelete: 'CASCADE' });
InstitutionStudent.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

Institution.hasMany(Batch, { foreignKey: 'institutionId', as: 'batches', onDelete: 'CASCADE' });
Batch.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

Institution.hasMany(Course, { foreignKey: 'institutionId', as: 'courses', onDelete: 'CASCADE' });
Course.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

Institution.hasMany(InstitutionCertificate, { foreignKey: 'institutionId', as: 'institutionCertificates', onDelete: 'CASCADE' });
InstitutionCertificate.belongsTo(Institution, { foreignKey: 'institutionId', as: 'institution' });

InstitutionStudent.hasMany(InstitutionCertificate, { foreignKey: 'studentId', as: 'certificates', onDelete: 'CASCADE' });
InstitutionCertificate.belongsTo(InstitutionStudent, { foreignKey: 'studentId', as: 'student' });

Course.hasMany(InstitutionCertificate, { foreignKey: 'courseId', as: 'certificates' });
InstitutionCertificate.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Batch ↔ InstitutionStudent (many-to-many via BatchStudent)
Batch.belongsToMany(InstitutionStudent, { through: BatchStudent, foreignKey: 'batchId', otherKey: 'studentId', as: 'students' });
InstitutionStudent.belongsToMany(Batch, { through: BatchStudent, foreignKey: 'studentId', otherKey: 'batchId', as: 'batches' });
Batch.hasMany(BatchStudent, { foreignKey: 'batchId', as: 'batchStudents' });
BatchStudent.belongsTo(Batch, { foreignKey: 'batchId', as: 'batch' });
BatchStudent.belongsTo(InstitutionStudent, { foreignKey: 'studentId', as: 'student' });

// Course ↔ InstitutionStudent (many-to-many via CourseStudent)
Course.belongsToMany(InstitutionStudent, { through: CourseStudent, foreignKey: 'courseId', otherKey: 'studentId', as: 'students' });
InstitutionStudent.belongsToMany(Course, { through: CourseStudent, foreignKey: 'studentId', otherKey: 'courseId', as: 'courses' });

module.exports = {
  User, Student, Company, Job, Application, Internship, Enrollment,
  Resource, Certificate, Enquiry,
  Institution, InstitutionStudent, Batch, BatchStudent,
  Course, CourseStudent, InstitutionCertificate,
};
require('./internshipPlatform');
