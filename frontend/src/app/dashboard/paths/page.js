'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
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
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

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

    // Compute stats
    var activeCount = roadmaps.filter(function (r) { return !isRoadmapComplete(r); }).length;
    var completedCount = roadmaps.filter(function (r) { return isRoadmapComplete(r); }).length;

    // Filter roadmaps by tab and search
    var filteredRoadmaps = useMemo(function () {
        var list = roadmaps;
        if (activeTab === 'active') {
            list = list.filter(function (r) { return !isRoadmapComplete(r); });
        } else if (activeTab === 'completed') {
            list = list.filter(function (r) { return isRoadmapComplete(r); });
        }
        if (searchQuery.trim()) {
            var q = searchQuery.toLowerCase();
            list = list.filter(function (r) {
                return (r.title && r.title.toLowerCase().includes(q)) ||
                    (r.description && r.description.toLowerCase().includes(q));
            });
        }
        return list;
    }, [roadmaps, activeTab, searchQuery]);

    if (authLoading || loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading your learning paths...</p>
            </div>
        );
    }

    return (
        <div className="paths-page">
            {/* Header */}
            <div className="paths-header">
                <div>
                    <h1 className="paths-title">Learning Paths</h1>
                    <p className="paths-subtitle">
                        Create, manage, and track your personalized learning roadmaps
                    </p>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="paths-stats-bar">
                <div className="paths-stat">
                    <span className="paths-stat-num">{roadmaps.length}</span>
                    <span className="paths-stat-label">Total</span>
                </div>
                <div className="paths-stat paths-stat-active">
                    <span className="paths-stat-num">{activeCount}</span>
                    <span className="paths-stat-label">Active</span>
                </div>
                <div className="paths-stat paths-stat-done">
                    <span className="paths-stat-num">{completedCount}</span>
                    <span className="paths-stat-label">Completed</span>
                </div>
            </div>

            {/* Generate Section */}
            <div className="paths-generate-card">
                <div className="paths-generate-header">
                    <div className="paths-generate-icon">+</div>
                    <div>
                        <h2 className="paths-generate-title">Create a New Learning Path</h2>
                        <p className="paths-generate-desc">
                            Enter any topic and our AI will research it, find the best resources, and build a structured roadmap for you.
                        </p>
                    </div>
                </div>
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
                            'Generate'
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

            {/* Tabs + Search */}
            {roadmaps.length > 0 && (
                <div className="paths-toolbar">
                    <div className="paths-tabs">
                        <button
                            className={'paths-tab' + (activeTab === 'all' ? ' paths-tab-active' : '')}
                            onClick={function () { setActiveTab('all'); }}
                        >
                            All <span className="paths-tab-count">{roadmaps.length}</span>
                        </button>
                        <button
                            className={'paths-tab' + (activeTab === 'active' ? ' paths-tab-active' : '')}
                            onClick={function () { setActiveTab('active'); }}
                        >
                            Active <span className="paths-tab-count">{activeCount}</span>
                        </button>
                        <button
                            className={'paths-tab' + (activeTab === 'completed' ? ' paths-tab-active' : '')}
                            onClick={function () { setActiveTab('completed'); }}
                        >
                            Completed <span className="paths-tab-count">{completedCount}</span>
                        </button>
                    </div>
                    <input
                        type="text"
                        className="paths-search-input"
                        placeholder="Search paths..."
                        value={searchQuery}
                        onChange={function (e) { setSearchQuery(e.target.value); }}
                    />
                </div>
            )}

            {/* Roadmap Grid */}
            {filteredRoadmaps.length > 0 && (
                <div className="roadmap-grid">
                    {filteredRoadmaps.map(function (roadmap) {
                        return <RoadmapCard key={roadmap._id} roadmap={roadmap} onDelete={handleDelete} />;
                    })}
                </div>
            )}

            {/* Empty states */}
            {roadmaps.length > 0 && filteredRoadmaps.length === 0 && (
                <div className="empty-state">
                    <h2>No matching paths</h2>
                    <p>Try adjusting your search or filter to find your learning paths.</p>
                </div>
            )}

            {roadmaps.length === 0 && (
                <div className="empty-state empty-state-fresh">
                    <div className="empty-state-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect x="4" y="8" width="40" height="32" rx="6" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                            <line x1="12" y1="18" x2="36" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
                            <line x1="12" y1="24" x2="28" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                            <line x1="12" y1="30" x2="32" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
                            <circle cx="38" cy="34" r="8" fill="var(--accent)" opacity="0.15" />
                            <line x1="35" y1="34" x2="41" y2="34" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                            <line x1="38" y1="31" x2="38" y2="37" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2>No learning paths yet</h2>
                    <p>Create your first learning path by entering a topic above. Our AI will build a structured roadmap for you.</p>
                </div>
            )}
        </div>
    );
}
