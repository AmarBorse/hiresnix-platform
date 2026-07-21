const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect } = require('../middleware/auth');
const { Project, User, Student } = require('../models');
const { Op } = require('sequelize');

// ── Public: Get user portfolio by username ─────────────────────────
// GET /api/projects/u/:username
router.get('/u/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;

  // Find user by username (slug from name)
  const users = await User.findAll({ where: { role: 'student' }, attributes: ['id', 'name', 'email'] });
  const user = users.find(u => {
    const slug = u.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return slug === username.toLowerCase();
  });

  if (!user) return res.status(404).json({ success: false, message: 'Portfolio not found' });

  const student = await Student.findOne({ where: { userId: user.id } });
  const projects = await Project.findAll({
    where: { userId: user.id },
    order: [['featured', 'DESC'], ['order', 'ASC'], ['createdAt', 'DESC']],
  });

  // Increment view on first project (profile view)
  if (projects.length > 0) {
    await Project.increment('views', { where: { userId: user.id }, by: 0 }); // no-op, track separately
  }

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email },
      student: student ? {
        phone: student.phone,
        location: student.location,
        skills: student.skills,
        bio: student.bio,
        linkedinUrl: student.linkedinUrl,
        githubUrl: student.githubUrl,
        portfolioUrl: student.portfolioUrl,
        profilePic: student.profilePic,
        domain: student.domain,
      } : {},
      projects,
      totalProjects: projects.length,
    }
  });
}));

// ── Student: Get my projects ────────────────────────────────────────
router.get('/my', protect, asyncHandler(async (req, res) => {
  const projects = await Project.findAll({
    where: { userId: req.user.id },
    order: [['featured', 'DESC'], ['order', 'ASC'], ['createdAt', 'DESC']],
  });
  res.json({ success: true, data: projects });
}));

// ── Student: Add project ────────────────────────────────────────────
router.post('/', protect, asyncHandler(async (req, res) => {
  const { title, description, techStack, liveUrl, githubUrl, imageUrl, status, featured } = req.body;
  if (!title || !description) { res.status(400); throw new Error('Title and description required'); }

  const count = await Project.count({ where: { userId: req.user.id } });
  if (count >= 10) { res.status(400); throw new Error('Maximum 10 projects allowed'); }

  const project = await Project.create({
    userId: req.user.id,
    title, description,
    techStack: Array.isArray(techStack) ? techStack : (techStack || '').split(',').map(t => t.trim()).filter(Boolean),
    liveUrl: liveUrl || '',
    githubUrl: githubUrl || '',
    imageUrl: imageUrl || '',
    status: status || 'completed',
    featured: featured || false,
    order: count,
  });
  res.status(201).json({ success: true, data: project });
}));

// ── Student: Update project ─────────────────────────────────────────
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!project) { res.status(404); throw new Error('Project not found'); }
  const { title, description, techStack, liveUrl, githubUrl, imageUrl, status, featured, order } = req.body;
  await project.update({
    title: title || project.title,
    description: description || project.description,
    techStack: Array.isArray(techStack) ? techStack : (techStack || '').split(',').map(t => t.trim()).filter(Boolean),
    liveUrl: liveUrl ?? project.liveUrl,
    githubUrl: githubUrl ?? project.githubUrl,
    imageUrl: imageUrl ?? project.imageUrl,
    status: status || project.status,
    featured: featured ?? project.featured,
    order: order ?? project.order,
  });
  res.json({ success: true, data: project });
}));

// ── Student: Delete project ─────────────────────────────────────────
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const project = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!project) { res.status(404); throw new Error('Project not found'); }
  await project.destroy();
  res.json({ success: true, message: 'Project deleted' });
}));

// ── Public: Search portfolios ───────────────────────────────────────
router.get('/search', asyncHandler(async (req, res) => {
  const { tech, q } = req.query;
  let where = {};
  if (tech) where.techStack = { [Op.contains]: [tech] };
  if (q) where.title = { [Op.iLike]: `%${q}%` };

  const projects = await Project.findAll({
    where,
    limit: 20,
    order: [['views', 'DESC']],
  });
  res.json({ success: true, data: projects });
}));

module.exports = router;