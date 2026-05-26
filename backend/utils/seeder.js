/**
 * utils/seeder.js — Seed sample data into MySQL
 * Run: node utils/seeder.js
 */

require('dotenv').config({ path: '../.env' });
const { connectDB } = require('../config/db');
const { User, Student, Company, Job, Application, Internship, Resource } = require('../models');

const seed = async () => {
  await connectDB();
  console.log('\n🌱 Starting seed...\n');

  // Clear tables in correct FK order
  await Application.destroy({ where: {}, force: true });
  await Job.destroy({ where: {}, force: true });
  await Student.destroy({ where: {}, force: true });
  await Company.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  console.log('✅ Tables cleared');

  // ── Admin ─────────────────────────────────────────────────────
  await User.create({ name:'Admin Officer', email:'admin@pcu.edu', password:'Admin@123', role:'admin', isActive:true, isApproved:true });

  // ── Companies ─────────────────────────────────────────────────
  const compData = [
    { name:'TechCorp Solutions',  industry:'IT/Software', hq:'Pune'      },
    { name:'FinanceHub India',    industry:'Finance',     hq:'Mumbai'    },
    { name:'DataMinds Analytics', industry:'IT/Software', hq:'Bangalore' },
    { name:'CloudBase Systems',   industry:'IT/Software', hq:'Hyderabad' },
  ];
  const compUsers = [], compProfiles = [];
  for (const c of compData) {
    const slug = c.name.toLowerCase().replace(/\s/g, '');
    const u  = await User.create({ name:`${c.name} HR`, email:`hr@${slug}.com`, password:'Company@123', role:'company', isActive:true, isApproved:true });
    const cp = await Company.create({ userId:u.id, companyName:c.name, industry:c.industry, headquarters:c.hq, isVerified:true, employeeCount:'201-500' });
    compUsers.push(u); compProfiles.push(cp);
  }
  console.log('✅ Companies created');

  // ── Students ──────────────────────────────────────────────────
  const depts   = ['Computer Science','Information Technology','MCA','Electronics'];
  const skillSets = [
    ['JavaScript','React','Node.js','MongoDB'],
    ['Python','Django','Machine Learning','SQL'],
    ['Java','Spring Boot','MySQL','Docker'],
    ['React','TypeScript','GraphQL','AWS'],
    ['Data Science','Python','Pandas','TensorFlow'],
    ['PHP','Laravel','Vue.js','MySQL'],
  ];
  const roles    = ['Software Engineer','Data Analyst','Backend Developer','Full Stack Developer'];
  const salaries = [300000, 500000, 800000, 1200000, 1800000];

  const studentUsers = [], studentProfiles = [];
  for (let i = 0; i < 30; i++) {
    const cgpa   = parseFloat((Math.random() * 4 + 6).toFixed(2));
    const placed = Math.random() > 0.4;
    const u = await User.create({ name:`Student ${i+1}`, email:`student${i+1}@pcu.edu`, password:'Student@123', role:'student', isActive:true, isApproved:true });
    const s = await Student.create({
      userId:     u.id,
      rollNumber: `MCA2024${String(i+1).padStart(3,'0')}`,
      department: depts[i % depts.length],
      year:       (i % 2) + 3,
      cgpa,
      skills:     skillSets[i % skillSets.length],
      isProfileComplete: true,
      placementStatus: placed ? 'Placed' : 'Not Placed',
      ...(placed && {
        placedCompany: compData[i % compData.length].name,
        placedRole:    roles[i % roles.length],
        placedSalary:  salaries[i % salaries.length],
        placedOn:      new Date(2024, i % 12, 15),
      }),
    });
    studentUsers.push(u); studentProfiles.push(s);
  }
  console.log('✅ Students created');

  // ── Jobs ──────────────────────────────────────────────────────
  const jobsData = [
    { title:'Full Stack Developer', type:'Full-time', description:'Build scalable web apps with React & Node.js.',
      requiredSkills:['React','Node.js','MongoDB','JavaScript'],
      minCGPA:7.0, allowedDepartments:['Computer Science','MCA','Information Technology'], allowedYears:[3,4],
      salaryMin:600000, salaryMax:900000, salaryPeriod:'Annual', location:'Pune', openings:5 },
    { title:'Data Science Intern', type:'Internship', description:'Work on real-world ML projects with our team.',
      requiredSkills:['Python','Pandas','Machine Learning','SQL'],
      minCGPA:6.5, allowedDepartments:[], allowedYears:[3,4],
      salaryMin:15000, salaryMax:25000, salaryPeriod:'Monthly', location:'Bangalore', isRemote:true, openings:3 },
    { title:'Backend Engineer', type:'Full-time', description:'Design REST APIs for financial services platform.',
      requiredSkills:['Java','Spring Boot','MySQL','Docker'],
      minCGPA:7.5, allowedDepartments:['Computer Science','Information Technology'], allowedYears:[4],
      salaryMin:800000, salaryMax:1200000, salaryPeriod:'Annual', location:'Mumbai', openings:2 },
    { title:'Cloud DevOps Engineer', type:'Full-time', description:'Manage AWS infrastructure and build CI/CD pipelines.',
      requiredSkills:['AWS','Docker','Kubernetes','Linux'],
      minCGPA:6.0, allowedDepartments:[], allowedYears:[3,4],
      salaryMin:700000, salaryMax:1100000, salaryPeriod:'Annual', location:'Hyderabad', openings:4 },
  ];
  const jobs = [];
  for (let i = 0; i < jobsData.length; i++) {
    const j = await Job.create({
      ...jobsData[i],
      companyId:           compProfiles[i].id,
      postedById:          compUsers[i].id,
      status:              'Approved',
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    jobs.push(j);
  }
  console.log('✅ Jobs created');

  // ── Applications ──────────────────────────────────────────────
  const statuses = ['Applied','Shortlisted','Selected','Rejected','Under Review'];
  for (let i = 0; i < 20; i++) {
    try {
      await Application.create({
        jobId:       jobs[i % jobs.length].id,
        studentId:   studentProfiles[i].id,
        appliedById: studentUsers[i].id,
        status:      statuses[i % statuses.length],
        resumeUrl:   '/uploads/resumes/sample.pdf',
        matchScore:  Math.floor(Math.random() * 40) + 60,
        isEligible:  true,
        statusHistory: [{ status: 'Applied', changedAt: new Date() }],
      });
    } catch (e) { /* skip duplicates */ }
  }
  console.log('✅ Applications created');

  // ── Internships ──────────────────────────────────────────────
  const admin = await User.findOne({ where: { role: 'admin' } });
  if (admin) {
    await Internship.bulkCreate([
      {
        title: 'Full Stack Web Development', description: 'Build modern web apps with React & Node.js on real projects.',
        domain: 'Full Stack', duration: '8 Weeks', difficulty: 'Intermediate',
        technologies: ['React','Node.js','Express','MySQL','Tailwind CSS'],
        tasks: [
          { id: '1', title: 'Build REST API with Express', description: 'CRUD endpoints with MySQL', difficulty: 'Intermediate', dueWeek: 2 },
          { id: '2', title: 'Build React Frontend', description: 'Responsive UI consuming API', difficulty: 'Intermediate', dueWeek: 4 },
          { id: '3', title: 'Add JWT Authentication', description: 'Secure your full stack app', difficulty: 'Advanced', dueWeek: 6 },
          { id: '4', title: 'Deploy to Production', description: 'Deploy and write docs', difficulty: 'Advanced', dueWeek: 8 },
        ],
        status: 'Active', maxEnrollments: 50, relatedJobDomains: ['Full Stack','Frontend','Backend'], createdById: admin.id,
      },
      {
        title: 'Machine Learning with Python', description: 'Learn data science and build ML models with scikit-learn and TensorFlow.',
        domain: 'Data Science', duration: '6 Weeks', difficulty: 'Advanced',
        technologies: ['Python','scikit-learn','TensorFlow','Pandas','NumPy'],
        tasks: [
          { id: '1', title: 'Data Preprocessing & EDA', description: 'Clean and explore real dataset', difficulty: 'Intermediate', dueWeek: 1 },
          { id: '2', title: 'Classification Model', description: 'Train and evaluate classifier', difficulty: 'Advanced', dueWeek: 3 },
          { id: '3', title: 'Neural Network Project', description: 'Deep learning model', difficulty: 'Advanced', dueWeek: 5 },
          { id: '4', title: 'Model Deployment API', description: 'Serve model via FastAPI', difficulty: 'Advanced', dueWeek: 6 },
        ],
        status: 'Active', maxEnrollments: 30, relatedJobDomains: ['Data Science','ML Engineer','AI Engineer'], createdById: admin.id,
      },
      {
        title: 'UI/UX Design Fundamentals', description: 'Master Figma, design systems, and user-centred design.',
        domain: 'UI/UX Design', duration: '4 Weeks', difficulty: 'Beginner',
        technologies: ['Figma','Prototyping','Design Systems','User Research'],
        tasks: [
          { id: '1', title: 'Wireframes', description: 'Low-fidelity wireframes', difficulty: 'Easy', dueWeek: 1 },
          { id: '2', title: 'Design System in Figma', description: 'Reusable components', difficulty: 'Intermediate', dueWeek: 2 },
          { id: '3', title: 'Hi-Fi Prototype', description: 'Interactive mobile prototype', difficulty: 'Intermediate', dueWeek: 3 },
          { id: '4', title: 'User Testing', description: 'Conduct tests and iterate', difficulty: 'Intermediate', dueWeek: 4 },
        ],
        status: 'Active', maxEnrollments: 40, relatedJobDomains: ['UI/UX Designer','Product Designer'], createdById: admin.id,
      },
    ], { ignoreDuplicates: true });
    console.log('✅ Internships seeded');
  }

  // ── Resources ────────────────────────────────────────────────
  await Resource.bulkCreate([
    { title:'The Complete JavaScript Course', type:'Video', link:'https://www.udemy.com/course/the-complete-javascript-course/', domain:'Full Stack', category:'Beginner to Advanced', badge:'Bestseller', isPublic:true },
    { title:'React Official Documentation', type:'Article', link:'https://react.dev', domain:'Frontend', category:'Official Docs', badge:'Free', isPublic:true },
    { title:'Node.js Best Practices', type:'Article', link:'https://github.com/goldbergyoni/nodebestpractices', domain:'Backend', category:'Best Practices', badge:'Free', isPublic:true },
    { title:'Machine Learning Crash Course', type:'Video', link:'https://developers.google.com/machine-learning/crash-course', domain:'Data Science', category:'Beginner', badge:'Free by Google', isPublic:true },
    { title:'Python Data Science Handbook', type:'PDF', link:'https://jakevdp.github.io/PythonDataScienceHandbook/', domain:'Data Science', category:'Handbook', badge:'Free', isPublic:true },
    { title:'CSS Tricks — Complete Flexbox Guide', type:'Article', link:'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', domain:'Frontend', category:'Reference', badge:'Free', isPublic:true },
    { title:'System Design Primer', type:'Article', link:'https://github.com/donnemartin/system-design-primer', domain:'Backend', category:'Interview Prep', badge:'Free', isPublic:true },
    { title:'TypeScript Deep Dive', type:'PDF', link:'https://basarat.gitbook.io/typescript/', domain:'Full Stack', category:'Advanced', badge:'Free', isPublic:true },
    { title:'SQL Tutorial — W3Schools', type:'Article', link:'https://www.w3schools.com/sql/', domain:'Backend', category:'Beginner', badge:'Free', isPublic:true },
    { title:'Figma for Beginners', type:'Video', link:'https://www.youtube.com/watch?v=FTFaQWZBqQ8', domain:'UI/UX Design', category:'Beginner', badge:'Free', isPublic:true },
  ], { ignoreDuplicates: true });
  console.log('✅ Resources seeded');

  console.log('\n🎉 Seed completed!\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('  Admin   → admin@pcu.edu                / Admin@123');
  console.log('  Company → hr@techcorpsolutions.com     / Company@123');
  console.log('  Student → student1@pcu.edu             / Student@123');
  console.log('─────────────────────────────────────────────────────\n');
  process.exit(0);
};

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
