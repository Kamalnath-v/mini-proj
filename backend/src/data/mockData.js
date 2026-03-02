// Hardcoded demo roadmap template for "Backend Developer Path"
function getDemoRoadmap(userId) {
    return {
        userId,
        title: 'Backend Developer Path',
        description:
            'A comprehensive learning path to become a proficient backend developer, covering server-side programming, databases, and API design.',
        topics: [
            {
                title: 'Node.js Fundamentals',
                description: 'Learn the core concepts of Node.js runtime and its ecosystem.',
                subtopics: [
                    {
                        title: 'Event Loop & Async Programming',
                        description: 'Understand how Node.js handles asynchronous operations under the hood.',
                        resources: [
                            {
                                title: 'Node.js Event Loop Explained',
                                url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
                                type: 'documentation',
                            },
                            {
                                title: 'Asynchronous JavaScript — MDN',
                                url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous',
                                type: 'article',
                            },
                        ],
                        questions: [],
                    },
                    {
                        title: 'Modules & Package Management',
                        description: 'Learn about CommonJS, ES Modules, and npm for dependency management.',
                        resources: [
                            {
                                title: 'Node.js Modules Documentation',
                                url: 'https://nodejs.org/api/modules.html',
                                type: 'documentation',
                            },
                            {
                                title: 'npm Getting Started Guide',
                                url: 'https://docs.npmjs.com/getting-started',
                                type: 'tutorial',
                            },
                        ],
                        questions: [],
                    },
                    {
                        title: 'File System & Streams',
                        description: 'Work with the file system and understand readable/writable streams.',
                        resources: [
                            {
                                title: 'Node.js fs Module',
                                url: 'https://nodejs.org/api/fs.html',
                                type: 'documentation',
                            },
                            {
                                title: 'Understanding Streams in Node.js',
                                url: 'https://nodesource.com/blog/understanding-streams-in-nodejs',
                                type: 'article',
                            },
                        ],
                        questions: [],
                    },
                ],
            },
            {
                title: 'Express.js & REST APIs',
                description: 'Build robust RESTful APIs using the Express.js framework.',
                subtopics: [
                    {
                        title: 'Routing & Middleware',
                        description: 'Master Express routing patterns and the middleware pipeline.',
                        resources: [
                            {
                                title: 'Express.js Routing Guide',
                                url: 'https://expressjs.com/en/guide/routing.html',
                                type: 'documentation',
                            },
                            {
                                title: 'Writing Express Middleware',
                                url: 'https://expressjs.com/en/guide/writing-middleware.html',
                                type: 'tutorial',
                            },
                        ],
                        questions: [],
                    },
                    {
                        title: 'Error Handling & Validation',
                        description: 'Implement centralized error handling and input validation.',
                        resources: [
                            {
                                title: 'Express Error Handling',
                                url: 'https://expressjs.com/en/guide/error-handling.html',
                                type: 'documentation',
                            },
                            {
                                title: 'API Input Validation Best Practices',
                                url: 'https://blog.logrocket.com/express-js-input-validation/',
                                type: 'article',
                            },
                        ],
                        questions: [],
                    },
                    {
                        title: 'Authentication & Authorization',
                        description: 'Secure APIs with JWT tokens, sessions, and role-based access.',
                        resources: [
                            {
                                title: 'JWT Authentication Tutorial',
                                url: 'https://jwt.io/introduction',
                                type: 'article',
                            },
                            {
                                title: 'Passport.js Documentation',
                                url: 'http://www.passportjs.org/docs/',
                                type: 'documentation',
                            },
                        ],
                        questions: [],
                    },
                ],
            },
            {
                title: 'Databases & ORMs',
                description: 'Store, query, and manage data using SQL and NoSQL databases.',
                subtopics: [
                    {
                        title: 'MongoDB & Mongoose',
                        description: 'Model data with Mongoose schemas and perform CRUD with MongoDB.',
                        resources: [
                            {
                                title: 'Mongoose Getting Started',
                                url: 'https://mongoosejs.com/docs/',
                                type: 'documentation',
                            },
                            {
                                title: 'MongoDB University Free Courses',
                                url: 'https://university.mongodb.com/',
                                type: 'tutorial',
                            },
                        ],
                        questions: [],
                    },
                    {
                        title: 'SQL Fundamentals',
                        description: 'Understand relational databases, joins, indexes, and query optimization.',
                        resources: [
                            {
                                title: 'SQL Tutorial — W3Schools',
                                url: 'https://www.w3schools.com/sql/',
                                type: 'tutorial',
                            },
                            {
                                title: 'PostgreSQL Documentation',
                                url: 'https://www.postgresql.org/docs/',
                                type: 'documentation',
                            },
                        ],
                        questions: [],
                    },
                ],
            },
        ],
    };
}

// Dummy MCQ questions injected when "Generate Questions" is clicked
function getDemoQuestions(subtopicTitle) {
    return [
        {
            question: `What is a key concept in "${subtopicTitle}"?`,
            options: [
                'Understanding fundamentals',
                'Skipping basics',
                'Ignoring documentation',
                'Avoiding practice',
            ],
            correctAnswer: 0,
        },
        {
            question: `Which practice is recommended when learning "${subtopicTitle}"?`,
            options: [
                'Memorize everything without practice',
                'Build hands-on projects',
                'Only watch videos',
                'Copy-paste code without understanding',
            ],
            correctAnswer: 1,
        },
        {
            question: `What should you do if you get stuck on "${subtopicTitle}"?`,
            options: [
                'Give up immediately',
                'Skip to the next topic',
                'Consult documentation and community resources',
                'Delete all your code',
            ],
            correctAnswer: 2,
        },
    ];
}

module.exports = { getDemoRoadmap, getDemoQuestions };
