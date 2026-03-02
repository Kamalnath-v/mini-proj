'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RoadmapCard from '@/components/RoadmapCard';

function isRoadmapComplete(roadmap) {
    if (!roadmap.topics || roadmap.topics.length === 0) return false;
    var allDone = true;
    roadmap.topics.forEach(function (topic) {
        topic.subtopics.forEach(function (subtopic) {
            if (!subtopic.completed) allDone = false;
        });
    });
    return allDone;
}

export default function PathsPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const router = useRouter();
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [generateError, setGenerateError] = useState('');
    const [showUpload, setShowUpload] = useState(false);
    const [jsonText, setJsonText] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    useEffect(
        function () {
            if (!authLoading && !user) {
                router.push('/login');
                return;
            }
            if (user) fetchRoadmaps();
        },
        [user, authLoading]
    );

    async function fetchRoadmaps() {
        try {
            const res = await authFetch('/roadmaps');
            const data = await res.json();
            setRoadmaps(data);
        } catch (err) {
            console.error('Failed to fetch roadmaps:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(roadmapId) {
        if (!window.confirm('Are you sure you want to delete this learning path? This action cannot be undone.')) {
            return;
        }
        try {
            const res = await authFetch(`/roadmaps/${roadmapId}`, { method: 'DELETE' });
            if (res.ok) {
                setRoadmaps(function (prev) {
                    return prev.filter(function (r) { return r._id !== roadmapId; });
                });
            }
        } catch (err) {
            console.error('Failed to delete roadmap:', err);
        }
    }

    async function handleGenerate() {
        if (!topic.trim()) {
            setGenerateError('Please enter a topic');
            return;
        }
        setGenerating(true);
        setGenerateError('');
        try {
            const res = await authFetch('/roadmaps/generate', {
                method: 'POST',
                body: JSON.stringify({ topic: topic.trim() }),
            });
            const data = await res.json();
            if (res.ok) {
                setRoadmaps(function (prev) {
                    return [...prev, data.roadmap];
                });
                setTopic('');
            } else {
                setGenerateError(data.message || 'Generation failed');
            }
        } catch (err) {
            setGenerateError('Failed to generate roadmap: ' + err.message);
        } finally {
            setGenerating(false);
        }
    }

    async function handleUpload() {
        setUploadError('');
        var parsed;
        try {
            parsed = JSON.parse(jsonText);
        } catch (e) {
            setUploadError('Invalid JSON. Please check your syntax.');
            return;
        }

        setUploading(true);
        try {
            const res = await authFetch('/roadmaps/upload', {
                method: 'POST',
                body: JSON.stringify(parsed),
            });
            const data = await res.json();
            if (res.ok) {
                setRoadmaps(function (prev) {
                    return [...prev, data.roadmap];
                });
                setShowUpload(false);
                setJsonText('');
            } else {
                setUploadError(data.message || 'Upload failed');
            }
        } catch (err) {
            setUploadError('Upload failed: ' + err.message);
        } finally {
            setUploading(false);
        }
    }

    function handleFileSelect(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function (event) {
            setJsonText(event.target.result);
            setUploadError('');
        };
        reader.readAsText(file);
    }

    if (authLoading || loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading your learning paths...</p>
            </div>
        );
    }

    var activeRoadmaps = roadmaps.filter(function (r) { return !isRoadmapComplete(r); });
    var completedRoadmaps = roadmaps.filter(function (r) { return isRoadmapComplete(r); });

    return (
        <div className="paths-page">
            <div className="paths-header">
                <div>
                    <h1 className="paths-title">Learning Paths</h1>
                    <p className="paths-subtitle">
                        Create, manage, and track your personalized learning roadmaps
                    </p>
                </div>
            </div>

            {/* Generate Section */}
            <div className="paths-generate-card">
                <h2 className="paths-generate-title">Create a New Learning Path</h2>
                <p className="paths-generate-desc">
                    Enter any topic and our AI will research it, find the best resources, and build a structured roadmap for you.
                </p>
                <div className="generate-input-row">
                    <input
                        type="text"
                        className="form-input generate-topic-input"
                        placeholder="e.g. JavaScript fundamentals, Machine Learning, System Design..."
                        value={topic}
                        onChange={function (e) { setTopic(e.target.value); setGenerateError(''); }}
                        onKeyDown={function (e) { if (e.key === 'Enter' && !generating) handleGenerate(); }}
                        disabled={generating}
                    />
                    <button
                        onClick={handleGenerate}
                        className="btn-generate"
                        disabled={generating || !topic.trim()}
                    >
                        {generating ? (
                            <>
                                <span className="spinner-sm"></span> Generating...
                            </>
                        ) : (
                            '+ Generate'
                        )}
                    </button>
                </div>
                {generating && (
                    <p className="generate-progress">Researching and building your roadmap. This may take about a minute...</p>
                )}
                {generateError && <div className="auth-error">{generateError}</div>}
                <div className="paths-or-row">
                    <span className="paths-or-line"></span>
                    <span className="paths-or-text">or</span>
                    <span className="paths-or-line"></span>
                </div>
                <button
                    onClick={function () { setShowUpload(!showUpload); setUploadError(''); }}
                    className="btn-upload-alt"
                >
                    Upload from JSON file
                </button>
            </div>

            {showUpload && (
                <div className="upload-panel">
                    <div className="upload-panel-header">
                        <h3 className="upload-panel-title">Upload Roadmap from JSON</h3>
                        <button onClick={function () { setShowUpload(false); }} className="upload-close">&times;</button>
                    </div>
                    <p className="upload-hint">
                        Paste JSON or select a .json file. Structure: {'{'} "title", "description", "topics": [{'{'} "title", "subtopics": [{'{'} "title", "resources", "questions" {'}'}] {'}'}] {'}'}
                    </p>
                    <div className="upload-file-row">
                        <label className="btn-file-select">
                            Choose File
                            <input type="file" accept=".json" onChange={handleFileSelect} hidden />
                        </label>
                    </div>
                    <textarea
                        className="upload-textarea"
                        value={jsonText}
                        onChange={function (e) { setJsonText(e.target.value); setUploadError(''); }}
                        placeholder='{ "title": "My Roadmap", "topics": [...] }'
                        rows={10}
                    ></textarea>
                    {uploadError && <div className="auth-error">{uploadError}</div>}
                    <button
                        onClick={handleUpload}
                        className="btn-generate"
                        disabled={uploading || !jsonText.trim()}
                        style={{ width: '100%' }}
                    >
                        {uploading ? (
                            <>
                                <span className="spinner-sm"></span> Uploading...
                            </>
                        ) : (
                            'Upload Roadmap'
                        )}
                    </button>
                </div>
            )}

            {/* Active Paths */}
            {activeRoadmaps.length > 0 && (
                <div className="paths-section">
                    <h2 className="paths-section-title">
                        Active Paths
                        <span className="paths-count">{activeRoadmaps.length}</span>
                    </h2>
                    <div className="roadmap-grid">
                        {activeRoadmaps.map(function (roadmap) {
                            return <RoadmapCard key={roadmap._id} roadmap={roadmap} onDelete={handleDelete} />;
                        })}
                    </div>
                </div>
            )}

            {/* Completed Paths */}
            {completedRoadmaps.length > 0 && (
                <div className="paths-section">
                    <h2 className="paths-section-title">
                        Completed
                        <span className="paths-count paths-count-done">{completedRoadmaps.length}</span>
                    </h2>
                    <div className="roadmap-grid">
                        {completedRoadmaps.map(function (roadmap) {
                            return <RoadmapCard key={roadmap._id} roadmap={roadmap} onDelete={handleDelete} />;
                        })}
                    </div>
                </div>
            )}

            {roadmaps.length === 0 && (
                <div className="empty-state">
                    <h2>No learning paths yet</h2>
                    <p>Create your first learning path by entering a topic above.</p>
                </div>
            )}
        </div>
    );
}
