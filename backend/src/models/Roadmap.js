const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
});

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['article', 'video', 'documentation', 'tutorial'], default: 'article' },
});

const subtopicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    resources: [resourceSchema],
    questions: [questionSchema],
});

const topicSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subtopics: [subtopicSchema],
});

const roadmapSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        topics: [topicSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Roadmap', roadmapSchema);
