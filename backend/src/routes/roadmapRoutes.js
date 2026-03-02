const express = require('express');
const axios = require('axios');
const Roadmap = require('../models/Roadmap');
const authMiddleware = require('../middleware/authMiddleware');
const { getDemoQuestions } = require('../data/mockData');

const LLM_SERVER_URL = process.env.LLM_SERVER_URL || 'http://localhost:5001';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/roadmaps — list all roadmaps for the logged-in user
router.get('/', async function (req, res) {
    try {
        const roadmaps = await Roadmap.find({ userId: req.userId }).select(
            'title description createdAt topics'
        );
        res.json(roadmaps);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/roadmaps/:id — get a single roadmap with full nested data
router.get('/:id', async function (req, res) {
    try {
        const roadmap = await Roadmap.findOne({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        res.json(roadmap);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE /api/roadmaps/:id — delete a roadmap
router.delete('/:id', async function (req, res) {
    try {
        const roadmap = await Roadmap.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId,
        });

        if (!roadmap) {
            return res.status(404).json({ message: 'Roadmap not found' });
        }

        res.json({ message: 'Roadmap deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/roadmaps/generate — generate a roadmap using the LLM agent
router.post('/generate', async function (req, res) {
    try {
        const { topic } = req.body;

        if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        console.log(`[Generate] User ${req.userId} requested roadmap for: "${topic.trim()}"`);

        // Call the LLM server
        const llmResponse = await axios.post(
            `${LLM_SERVER_URL}/api/research`,
            { topic: topic.trim() },
            { timeout: 600000 } // 10 minute timeout (LLM research can take a while)
        );

        const roadmapData = llmResponse.data;

        // Normalize and save to MongoDB
        const roadmap = await Roadmap.create({
            userId: req.userId,
            title: roadmapData.title || topic.trim(),
            description: roadmapData.description || '',
            topics: (roadmapData.topics || []).map(function (topic) {
                return {
                    title: topic.title || 'Untitled Topic',
                    description: topic.description || '',
                    subtopics: (topic.subtopics || []).map(function (sub) {
                        return {
                            title: sub.title || 'Untitled Subtopic',
                            description: sub.description || '',
                            completed: false,
                            resources: (sub.resources || []).map(function (r) {
                                return {
                                    title: r.title || '',
                                    url: r.url || '',
                                    type: r.type || 'article',
                                };
                            }),
                            questions: (sub.questions || []).map(function (q) {
                                return {
                                    question: q.question || '',
                                    options: q.options || [],
                                    correctAnswer: q.correctAnswer || 0,
                                };
                            }),
                        };
                    }),
                };
            }),
        });

        console.log(`[Generate] Roadmap saved: ${roadmap._id}`);

        res.status(201).json({
            message: 'Roadmap generated successfully',
            roadmap,
        });
    } catch (error) {
        console.error('[Generate] Failed:', error.message);

        if (error.code === 'ECONNREFUSED') {
            return res.status(503).json({
                message: 'LLM server is not running. Start it with: cd llm && node src/index.js',
            });
        }

        res.status(500).json({ message: 'Failed to generate roadmap', error: error.message });
    }
});

// POST /api/roadmaps/upload — upload a roadmap from JSON
router.post('/upload', async function (req, res) {
    try {
        const { title, description, topics } = req.body;

        if (!title || !topics || !Array.isArray(topics) || topics.length === 0) {
            return res.status(400).json({
                message: 'JSON must include "title" (string) and "topics" (non-empty array)',
            });
        }

        var roadmapData = {
            userId: req.userId,
            title: title,
            description: description || '',
            topics: topics.map(function (topic) {
                return {
                    title: topic.title || 'Untitled Topic',
                    description: topic.description || '',
                    subtopics: (topic.subtopics || []).map(function (sub) {
                        return {
                            title: sub.title || 'Untitled Subtopic',
                            description: sub.description || '',
                            completed: sub.completed || false,
                            resources: (sub.resources || []).map(function (r) {
                                return {
                                    title: r.title || '',
                                    url: r.url || '',
                                    type: r.type || 'article',
                                };
                            }),
                            questions: (sub.questions || []).map(function (q) {
                                return {
                                    question: q.question || '',
                                    options: q.options || [],
                                    correctAnswer: q.correctAnswer || 0,
                                };
                            }),
                        };
                    }),
                };
            }),
        };

        const roadmap = await Roadmap.create(roadmapData);

        res.status(201).json({
            message: 'Roadmap uploaded successfully',
            roadmap,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/roadmaps/:roadmapId/topics/:topicIdx/subtopics/:subtopicIdx/generate-questions
router.post(
    '/:roadmapId/topics/:topicIdx/subtopics/:subtopicIdx/generate-questions',
    async function (req, res) {
        try {
            const { roadmapId, topicIdx, subtopicIdx } = req.params;

            const roadmap = await Roadmap.findOne({
                _id: roadmapId,
                userId: req.userId,
            });

            if (!roadmap) {
                return res.status(404).json({ message: 'Roadmap not found' });
            }

            const topic = roadmap.topics[parseInt(topicIdx)];
            if (!topic) {
                return res.status(404).json({ message: 'Topic not found' });
            }

            const subtopic = topic.subtopics[parseInt(subtopicIdx)];
            if (!subtopic) {
                return res.status(404).json({ message: 'Subtopic not found' });
            }

            const questions = getDemoQuestions(subtopic.title);
            subtopic.questions.push(...questions);

            await roadmap.save();

            res.status(201).json({
                message: 'Demo questions generated successfully',
                questions: subtopic.questions,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

// PATCH /api/roadmaps/:roadmapId/topics/:topicIdx/subtopics/:subtopicIdx/toggle-complete
router.patch(
    '/:roadmapId/topics/:topicIdx/subtopics/:subtopicIdx/toggle-complete',
    async function (req, res) {
        try {
            const { roadmapId, topicIdx, subtopicIdx } = req.params;

            const roadmap = await Roadmap.findOne({
                _id: roadmapId,
                userId: req.userId,
            });

            if (!roadmap) {
                return res.status(404).json({ message: 'Roadmap not found' });
            }

            const topic = roadmap.topics[parseInt(topicIdx)];
            if (!topic) {
                return res.status(404).json({ message: 'Topic not found' });
            }

            const subtopic = topic.subtopics[parseInt(subtopicIdx)];
            if (!subtopic) {
                return res.status(404).json({ message: 'Subtopic not found' });
            }

            subtopic.completed = !subtopic.completed;
            await roadmap.save();

            res.json({
                message: 'Subtopic completion toggled',
                completed: subtopic.completed,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error', error: error.message });
        }
    }
);

module.exports = router;
