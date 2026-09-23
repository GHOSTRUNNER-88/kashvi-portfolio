/**
 * All site content, shaped the way the API will return it so that wiring the
 * Express/Mongo backend later is a fetch swap and nothing more. Anything the
 * admin dashboard will edit lives here and nowhere else.
 *
 * `cover` and `shots` are Cloudinary public IDs once uploads are in; null
 * until then, and every view already renders without them.
 */

export const profile = {
  name: 'Kashvi Jain',
  role: 'Web developer',
  city: 'New Road, Kathmandu',
  coords: '27.72°N 85.32°E',
  status: 'Open to internships & freelance',
  email: 'kashvijain2910@gmail.com',
  phones: ['+91 90381 05437', '+977 986 290 5165'],
  intro:
    'Aspiring software developer building responsive web applications with React, Node.js and Spring Boot and currently reading B.Tech CSE at KIIT University.',
  about:
    'A strong interest in web development and modern technologies. Skilled in building responsive web applications using HTML, CSS, JavaScript and React, with backend experience in Node.js and Spring Boot.',
  aboutNote:
    'Happiest making real-world projects, picking up new tools, and sharpening problem-solving along the way.',
  glance: [
    ['Based', 'New Road, Kathmandu'],
    ['Studying', 'B.Tech CSE · KIIT'],
    ['Stack', 'MERN · Spring Boot'],
    ['Since', '2024'],
  ],
}

export const projects = [
  {
    slug: 'resumelab',
    title: 'ResumeLab',
    meta: 'MERN · AI',
    year: '2025',
    summary:
      'An AI-powered resume builder that turns a rough history into a structured, readable CV.',
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'AI'],
    cover: null,
    shots: [],
    body: [
      'Most people know what they have done but not how to set it down. ResumeLab takes a rough, unordered history — jobs, projects, coursework — and returns a structured CV with consistent tense, ordering and emphasis.',
      'The front end is React, with the document held as structured state rather than free text so a section can be reordered or re-weighted without rewriting it. Node and Express sit behind it, with MongoDB holding each draft and its revisions.',
      'The generation step is prompt-driven: the raw history goes out with a schema describing the sections expected back, so the response can be validated before it reaches the editor rather than trusted blindly.',
    ],
    highlights: [
      ['Structured drafts', 'Documents are state, not text, so sections reorder without a rewrite.'],
      ['Validated output', 'Generated sections are checked against a schema before they render.'],
      ['Revision history', 'Every draft is versioned in MongoDB.'],
    ],
    links: [],
  },
  {
    slug: 'expozia',
    title: 'Expozia',
    meta: 'MERN · AI',
    year: '2025',
    summary:
      'An AI-powered plagiarism detection platform for checking written work at scale.',
    stack: ['React', 'Node.js', 'Express', 'MongoDB', 'AI'],
    cover: null,
    shots: [],
    body: [
      'Expozia checks written submissions for copied and paraphrased material, and reports what it found rather than only a percentage — a number on its own tells a marker nothing about where to look.',
      'Submissions are broken into passages and compared both literally and semantically, so reworded material still surfaces. Results come back per passage with the matched source alongside, which is the form a marker can actually act on.',
      'The stack is MERN throughout: React for the review interface, Express for the checking pipeline, MongoDB for submissions and their reports.',
    ],
    highlights: [
      ['Passage level', 'Findings are reported per passage, with the match beside them.'],
      ['Beyond literal', 'Semantic comparison catches reworded material, not just copied strings.'],
      ['Built for scale', 'The pipeline is queued so a batch does not block a single check.'],
    ],
    links: [],
  },
]

export const experience = [
  {
    slug: 'independent-project-development',
    title: 'Independent project development',
    meta: '2025',
    year: '2025',
    summary:
      'Full-stack development of ResumeLab and Expozia on the MERN stack, end to end.',
    body: [
      'A year spent building two complete applications rather than following tutorials — deciding the data model, writing the API, building the interface and deploying the result.',
      'Both are MERN: React on the front, Express and Node behind it, MongoDB underneath. Working end to end meant the awkward parts could not be skipped — auth, validation, error states and the shape of the data before any of it was written.',
    ],
    highlights: [
      ['ResumeLab', 'AI-powered resume builder.'],
      ['Expozia', 'AI-powered plagiarism detection.'],
    ],
  },
  {
    slug: 'software-development-skill-enhancement',
    title: 'Software development & skill enhancement',
    meta: '2026',
    year: '2026',
    summary:
      'DSA practice in C across coding platforms. React on the front end, Node.js and Spring Boot behind it, applying theory to real scenarios.',
    body: [
      'Daily data structures and algorithms practice in C across the usual platforms, kept up alongside the project work rather than instead of it.',
      'In parallel, widening the stack: React patterns beyond the basics on the front end, and both Node.js and Spring Boot on the back so the choice of runtime is a decision rather than a default.',
    ],
    highlights: [
      ['DSA in C', 'Practised across competitive platforms.'],
      ['Spring Boot', 'A second backend runtime alongside Node.'],
    ],
  },
]

export const education = [
  {
    title: 'KIIT University',
    meta: '2024 — 2028',
    summary: 'B.Tech in Engineering — Computer Science.',
  },
  {
    title: 'DAV Sushil Kedia Vishwa Bharati',
    meta: '2022 — 2024',
    summary: 'Senior Secondary, Class XII — Science.',
  },
  {
    title: 'DAV Sushil Kedia Vishwa Bharati',
    meta: 'to 2022',
    summary: 'Secondary, Class X.',
  },
]

export const skills = [
  'HTML / CSS / JS',
  'React',
  'Node.js',
  'Express',
  'MongoDB',
  'Spring Boot',
  'C & DSA',
  'Microsoft Office',
]

/**
 * One screen of scroll each. `tint` is the section's colour: the red wall is
 * photographed into the frames and cannot be replaced, so it grades the flanks
 * and the accents around her instead of the backdrop itself.
 */
export const sections = [
  {
    id: 'intro',
    nav: 'Intro',
    side: 'center',
    tint: '58 10 6',
    gold: '#e9c393',
    eyebrow: 'Web developer from Kathmandu',
    head: ['Kashvi', 'Jain.'],
    lede: profile.intro,
    actions: true,
    aside: { label: 'At a glance', rows: profile.glance },
  },
  {
    id: 'about',
    nav: 'About',
    side: 'right',
    tint: '44 14 48',
    gold: '#e6b6d2',
    eyebrow: '01 About',
    head: ['Always', 'learning.'],
    lede: profile.about,
    note: profile.aboutNote,
  },
  {
    id: 'work',
    nav: 'Work',
    side: 'left',
    tint: '10 42 46',
    gold: '#9ee0dc',
    eyebrow: '02 Selected work',
    head: ['Two things', 'I built.'],
    items: projects,
    to: '/work',
  },
  {
    id: 'experience',
    nav: 'Experience',
    side: 'right',
    tint: '54 30 8',
    gold: '#f0c98a',
    eyebrow: '03 Experience',
    head: ['Independent', 'practice.'],
    items: experience,
    to: '/experience',
  },
  {
    id: 'education',
    nav: 'Education',
    side: 'left',
    tint: '14 30 56',
    gold: '#a9c8f0',
    eyebrow: '04 Education',
    head: ['KIIT', 'University.'],
    items: education,
  },
  {
    id: 'contact',
    nav: 'Contact',
    side: 'center',
    tint: '52 10 22',
    gold: '#f0aeb4',
    eyebrow: '05 Contact',
    head: ['Let’s build', 'something.'],
    contact: [
      ['Email', profile.email, `mailto:${profile.email}`],
      ...profile.phones.map((n) => ['Phone', n, `tel:${n.replace(/\s/g, '')}`]),
      ['Location', profile.city, null],
    ],
    aside: { label: 'Toolkit', tags: skills },
  },
]

export const bySlug = (list, slug) => list.find((x) => x.slug === slug)
