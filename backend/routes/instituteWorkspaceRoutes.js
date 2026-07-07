const express = require('express');
const router = express.Router();
const {
  courses, batches, students, assessments, assignments, certificates, getDashboard,
} = require('../controllers/instituteWorkspaceController');
const { protect, authorize } = require('../middleware/auth');
const { resolveInstitution } = require('../middleware/institution');

router.use(protect, authorize('institution'), resolveInstitution);

router.get('/dashboard', getDashboard);

function crudRoutes(resource, handlers) {
  router.get(`/${resource}`, handlers.list);
  router.post(`/${resource}`, handlers.create);
  router.put(`/${resource}/:id`, handlers.update);
  router.delete(`/${resource}/:id`, handlers.remove);
}

crudRoutes('courses', courses);
crudRoutes('batches', batches);
crudRoutes('students', students);
crudRoutes('assessments', assessments);
crudRoutes('assignments', assignments);
crudRoutes('certificates', certificates);

module.exports = router;
