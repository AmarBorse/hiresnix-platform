/**
 * utils/academyCourses.js
 * Lesson structure of every AI Academy course (lessons per module).
 * Used to check on the server that a course is really finished before
 * issuing a certificate.
 *
 * KEEP IN SYNC with COURSES in frontend/src/pages/instStudent/AcademyPage.tsx
 * (if you add/remove lessons there, update the numbers here).
 */

const ACADEMY_COURSES = {
  "python": { title: "Python Programming", modules: [5, 7, 5, 6, 4, 6, 5, 5] },
  "javascript": { title: "JavaScript", modules: [8, 6, 5, 5, 5, 6, 4] },
  "java": { title: "Java", modules: [6, 7, 7, 10, 3] },
  "cpp": { title: "C++", modules: [6, 7, 4, 4, 6, 6, 3] },
  "c": { title: "C Programming", modules: [7, 7, 6, 6, 6, 3] },
  "dsa": { title: "DSA", modules: [4, 5, 4, 5, 5, 6, 7, 6] },
  "sql": { title: "SQL & Databases", modules: [7, 6, 8, 11, 1] },
  "webdev": { title: "Full Stack Web Dev", modules: [7, 9, 6, 10, 7, 5] },
  "react": { title: "React.js", modules: [7, 7, 5, 6, 4] },
  "nodejs": { title: "Node.js & Express", modules: [6, 6, 7, 7] },
  "datascience": { title: "Data Science", modules: [4, 6, 7, 6, 5, 4] },
  "ml": { title: "Machine Learning", modules: [6, 8, 5, 6, 6, 4] },
  "git": { title: "Git & GitHub", modules: [8, 6, 7, 7] },
  "docker": { title: "Docker & DevOps", modules: [7, 6, 6, 6, 4] },
  "cybersecurity": { title: "Cybersecurity", modules: [8, 6, 7, 5, 7] },
  "flutter": { title: "Flutter & Dart", modules: [9, 7, 8, 6, 7, 3] },
};

/** All lesson keys for a course, in the same "moduleIndex-lessonIndex" format the frontend uses */
function lessonKeys(courseId) {
  const c = ACADEMY_COURSES[courseId];
  if (!c) return [];
  return c.modules.flatMap((count, mi) => Array.from({ length: count }, (_, li) => mi + "-" + li));
}

function isCourseComplete(courseId, completed) {
  const keys = lessonKeys(courseId);
  if (!keys.length) return false;
  const done = new Set(Array.isArray(completed) ? completed : []);
  return keys.every(k => done.has(k));
}

module.exports = { ACADEMY_COURSES, lessonKeys, isCourseComplete };
