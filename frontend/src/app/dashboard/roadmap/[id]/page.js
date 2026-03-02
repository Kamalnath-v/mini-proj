'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Accordion from '@/components/Accordion';
import QuizCard from '@/components/QuizCard';
import ClarifyChat from '@/components/ClarifyChat';
import VisualizationModal from '@/components/VisualizationModal';

const LLM_URL = 'http://localhost:5001';

export default function RoadmapDetailPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const router = useRouter();
    const params = useParams();
    const [roadmap, setRoadmap] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generatingQuestions, setGeneratingQuestions] = useState({});
    const [togglingComplete, setTogglingComplete] = useState({});
    const [vizLoading, setVizLoading] = useState({});
    const [vizModal, setVizModal] = useState({ open: false, html: '', title: '' });
    const [vizPrompt, setVizPrompt] = useState({ open: false, topicIdx: null, subtopicIdx: null, subtopic: null });
    const [vizContext, setVizContext] = useState('');

    useEffect(
        function () {
            if (!authLoading && !user) {
                router.push('/login');
                return;
            }
            if (user && params.id) fetchRoadmap();
        },
        [user, authLoading, params.id]
    );

    async function fetchRoadmap() {
        try {
            const res = await authFetch(`/roadmaps/${params.id}`);
            if (!res.ok) {
                router.push('/dashboard');
                return;
            }
            const data = await res.json();
            setRoadmap(data);
        } catch (err) {
            console.error('Failed to fetch roadmap:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleComplete(topicIdx, subtopicIdx) {
        const key = `${topicIdx}-${subtopicIdx}`;
        setTogglingComplete(function (prev) {
            return { ...prev, [key]: true };
        });

        try {
            const res = await authFetch(
                `/roadmaps/${params.id}/topics/${topicIdx}/subtopics/${subtopicIdx}/toggle-complete`,
                { method: 'PATCH' }
            );
            const data = await res.json();

            if (res.ok) {
                setRoadmap(function (prev) {
                    const updated = JSON.parse(JSON.stringify(prev));
                    updated.topics[topicIdx].subtopics[subtopicIdx].completed = data.completed;
                    return updated;
                });
            }
        } catch (err) {
            console.error('Failed to toggle completion:', err);
        } finally {
            setTogglingComplete(function (prev) {
                return { ...prev, [key]: false };
            });
        }
    }

    async function handleGenerateQuestions(topicIdx, subtopicIdx) {
        const key = `${topicIdx}-${subtopicIdx}`;
        setGeneratingQuestions(function (prev) {
            return { ...prev, [key]: true };
        });

        try {
            const res = await authFetch(
                `/roadmaps/${params.id}/topics/${topicIdx}/subtopics/${subtopicIdx}/generate-questions`,
                { method: 'POST' }
            );
            const data = await res.json();

            if (res.ok) {
                setRoadmap(function (prev) {
                    const updated = JSON.parse(JSON.stringify(prev));
                    updated.topics[topicIdx].subtopics[subtopicIdx].questions = data.questions;
                    return updated;
                });
            }
        } catch (err) {
            console.error('Failed to generate questions:', err);
        } finally {
            setGeneratingQuestions(function (prev) {
                return { ...prev, [key]: false };
            });
        }
    }

    function openVizPrompt(topicIdx, subtopicIdx, subtopic) {
        setVizPrompt({ open: true, topicIdx: topicIdx, subtopicIdx: subtopicIdx, subtopic: subtopic });
        setVizContext('');
    }

    async function handleVisualize() {
        var topicIdx = vizPrompt.topicIdx;
        var subtopicIdx = vizPrompt.subtopicIdx;
        var subtopic = vizPrompt.subtopic;
        var userContext = vizContext.trim();
        setVizPrompt({ open: false, topicIdx: null, subtopicIdx: null, subtopic: null });

        const key = `${topicIdx}-${subtopicIdx}`;
        setVizLoading(function (prev) {
            return { ...prev, [key]: true };
        });

        try {
            var body = {
                subtopic: {
                    title: subtopic.title,
                    description: subtopic.description,
                },
            };
            if (userContext) {
                body.userContext = userContext;
            }

            const res = await fetch(LLM_URL + '/api/visualize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (res.ok && data.html) {
                setVizModal({ open: true, html: data.html, title: subtopic.title });
            } else {
                alert('Failed to generate visualization: ' + (data.message || 'Unknown error'));
            }
        } catch (err) {
            alert('Could not reach LLM server. Make sure it is running on port 5001.');
            console.error('Visualize error:', err);
        } finally {
            setVizLoading(function (prev) {
                return { ...prev, [key]: false };
            });
        }
    }

    if (authLoading || loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading roadmap...</p>
            </div>
        );
    }

    if (!roadmap) {
        return (
            <div className="page-loader">
                <p>Roadmap not found</p>
            </div>
        );
    }

    var totalSubtopics = 0;
    var completedSubtopics = 0;
    roadmap.topics.forEach(function (topic) {
        topic.subtopics.forEach(function (subtopic) {
            totalSubtopics++;
            if (subtopic.completed) completedSubtopics++;
        });
    });
    var progressPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    return (
        <div className="roadmap-detail">
            <button onClick={function () { router.push('/dashboard'); }} className="back-btn">
                &larr; Back to Dashboard
            </button>

            <div className="roadmap-detail-header">
                <h1 className="roadmap-detail-title">{roadmap.title}</h1>
                <p className="roadmap-detail-desc">{roadmap.description}</p>
                <div className="roadmap-detail-meta">
                    <span className="meta-badge">{roadmap.topics.length} Topics</span>
                    <span className="meta-badge">
                        {totalSubtopics} Subtopics
                    </span>
                    <span className="meta-badge meta-badge-progress">
                        {completedSubtopics}/{totalSubtopics} Done
                    </span>
                </div>
                <div className="progress-section" style={{ marginTop: '16px' }}>
                    <div className="progress-bar progress-bar-lg">
                        <div className="progress-fill" style={{ width: progressPercent + '%' }}></div>
                    </div>
                    <span className="progress-text">
                        {progressPercent}% complete
                    </span>
                </div>
                <button
                    className="btn-download-json"
                    onClick={function () {
                        var exportData = {
                            title: roadmap.title,
                            description: roadmap.description,
                            topics: roadmap.topics.map(function (t) {
                                return {
                                    title: t.title,
                                    description: t.description,
                                    subtopics: t.subtopics.map(function (s) {
                                        return {
                                            title: s.title,
                                            description: s.description,
                                            completed: s.completed,
                                            resources: s.resources,
                                            questions: s.questions.map(function (q) {
                                                return { question: q.question, options: q.options, correctAnswer: q.correctAnswer };
                                            }),
                                        };
                                    }),
                                };
                            }),
                        };
                        var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement('a');
                        a.href = url;
                        a.download = roadmap.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    Download JSON
                </button>
            </div>

            <div className="topics-list">
                {roadmap.topics.map(function (topic, topicIdx) {
                    var topicDone = topic.subtopics.length > 0 && topic.subtopics.every(function (s) { return s.completed; });
                    return (
                        <Accordion
                            key={topicIdx}
                            title={topic.title}
                            subtitle={topic.description}
                            badge={`${topic.subtopics.length} subtopics`}
                            completed={topicDone}
                        >
                            <div className="subtopics-list">
                                {topic.subtopics.map(function (subtopic, subtopicIdx) {
                                    const qKey = `${topicIdx}-${subtopicIdx}`;
                                    return (
                                        <Accordion
                                            key={subtopicIdx}
                                            title={subtopic.title}
                                            subtitle={subtopic.description}
                                        >
                                            {/* Complete + Visualize buttons */}
                                            <div className="complete-section">
                                                <button
                                                    onClick={function () {
                                                        handleToggleComplete(topicIdx, subtopicIdx);
                                                    }}
                                                    className={`btn-complete ${subtopic.completed ? 'btn-completed' : ''}`}
                                                    disabled={togglingComplete[qKey]}
                                                >
                                                    {togglingComplete[qKey] ? (
                                                        <>
                                                            <span className="spinner-sm"></span> Updating...
                                                        </>
                                                    ) : subtopic.completed ? (
                                                        <>{'\u2713'} Completed</>
                                                    ) : (
                                                        'Mark as Complete'
                                                    )}
                                                </button>
                                                <button
                                                    onClick={function () {
                                                        openVizPrompt(topicIdx, subtopicIdx, subtopic);
                                                    }}
                                                    className="btn-visualize"
                                                    disabled={vizLoading[qKey]}
                                                >
                                                    {vizLoading[qKey] ? (
                                                        <>
                                                            <span className="spinner-sm"></span> Generating...
                                                        </>
                                                    ) : (
                                                        'Visualize'
                                                    )}
                                                </button>
                                            </div>

                                            {/* Resources */}
                                            {subtopic.resources.length > 0 && (
                                                <div className="resources-section">
                                                    <h4 className="section-label">Resources</h4>
                                                    <ul className="resources-list">
                                                        {subtopic.resources.map(function (resource, rIdx) {
                                                            return (
                                                                <li key={rIdx} className="resource-item">
                                                                    <a
                                                                        href={resource.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="resource-link"
                                                                    >
                                                                        <span className="resource-type-badge">
                                                                            {resource.type}
                                                                        </span>
                                                                        {resource.title}
                                                                    </a>
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Ask AI */}
                                            <ClarifyChat subtopic={subtopic} />

                                            {/* Questions */}
                                            {subtopic.questions.length > 0 && (
                                                <div className="questions-section">
                                                    <h4 className="section-label">Quiz</h4>
                                                    <div className="quiz-list">
                                                        {subtopic.questions.map(function (q, qIdx) {
                                                            return <QuizCard key={qIdx} question={q} index={qIdx} />;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </Accordion>
                                    );
                                })}
                            </div>
                        </Accordion>
                    );
                })}
            </div>

            {vizPrompt.open && (
                <div className="viz-overlay" onClick={function () { setVizPrompt({ open: false, topicIdx: null, subtopicIdx: null, subtopic: null }); }}>
                    <div className="viz-prompt-dialog" onClick={function (e) { e.stopPropagation(); }}>
                        <h3 className="viz-prompt-title">Generate Visualization</h3>
                        <p className="viz-prompt-subtitle">{vizPrompt.subtopic ? vizPrompt.subtopic.title : ''}</p>
                        <p className="viz-prompt-hint">
                            Add extra context to guide the visualization (optional). For example: "focus on how recursion works step by step" or "show a comparison table".
                        </p>
                        <textarea
                            className="viz-prompt-input"
                            placeholder="e.g. Show an animated diagram of how the call stack works..."
                            value={vizContext}
                            onChange={function (e) { setVizContext(e.target.value); }}
                            rows={3}
                        ></textarea>
                        <div className="viz-prompt-actions">
                            <button
                                className="viz-prompt-skip"
                                onClick={function () { setVizContext(''); handleVisualize(); }}
                            >
                                Skip & Generate
                            </button>
                            <button
                                className="viz-prompt-go"
                                onClick={handleVisualize}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {vizModal.open && (
                <VisualizationModal
                    html={vizModal.html}
                    subtopicTitle={vizModal.title}
                    onClose={function () { setVizModal({ open: false, html: '', title: '' }); }}
                />
            )}
        </div>
    );
}
