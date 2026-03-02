'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, topics: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(
        function () {
            if (!authLoading && !user) {
                router.push('/login');
                return;
            }
            if (user) fetchStats();
        },
        [user, authLoading]
    );

    async function fetchStats() {
        try {
            const res = await authFetch('/roadmaps');
            const data = await res.json();
            var completed = 0;
            var totalTopics = 0;
            data.forEach(function (r) {
                var allDone = true;
                if (r.topics && r.topics.length > 0) {
                    totalTopics += r.topics.length;
                    r.topics.forEach(function (t) {
                        t.subtopics.forEach(function (s) {
                            if (!s.completed) allDone = false;
                        });
                    });
                } else {
                    allDone = false;
                }
                if (allDone) completed++;
            });
            setStats({
                total: data.length,
                active: data.length - completed,
                completed: completed,
                topics: totalTopics,
            });
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setLoading(false);
        }
    }

    if (authLoading || loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-overview">
            <div className="overview-welcome">
                <h1 className="overview-title">
                    Welcome back{user.username ? `, ${user.username}` : ''}
                </h1>
                <p className="overview-subtitle">
                    Here is an overview of your learning journey on SARAL.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="overview-stats">
                <div className="stat-card">
                    <span className="stat-number">{stats.total}</span>
                    <span className="stat-label">Total Paths</span>
                </div>
                <div className="stat-card stat-card-active">
                    <span className="stat-number">{stats.active}</span>
                    <span className="stat-label">In Progress</span>
                </div>
                <div className="stat-card stat-card-done">
                    <span className="stat-number">{stats.completed}</span>
                    <span className="stat-label">Completed</span>
                </div>
                <div className="stat-card">
                    <span className="stat-number">{stats.topics}</span>
                    <span className="stat-label">Topics Covered</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="overview-actions">
                <Link href="/dashboard/paths" className="action-card action-card-primary">
                    <h3 className="action-title">Learning Paths</h3>
                    <p className="action-desc">View, create, and manage your personalized learning roadmaps.</p>
                    <span className="action-link">Go to Paths &rarr;</span>
                </Link>
                <Link href="/profile" className="action-card">
                    <h3 className="action-title">Profile Settings</h3>
                    <p className="action-desc">Update your username, email, or change your password.</p>
                    <span className="action-link">Edit Profile &rarr;</span>
                </Link>
            </div>

            {/* About Section */}
            <div className="overview-about">
                <h2 className="overview-section-title">About SARAL</h2>
                <p className="overview-about-text">
                    SARAL is an AI-powered learning platform that creates personalized roadmaps for any topic you want to learn.
                    Our deep research agent searches the web, analyzes resources, and builds structured learning paths complete
                    with curated articles, documentation, and interactive quizzes.
                </p>
                <div className="overview-features">
                    <div className="overview-feature">
                        <h4 className="overview-feature-title">AI-Generated Roadmaps</h4>
                        <p className="overview-feature-desc">
                            Enter any topic and our AI researches it deeply, finding the best resources and structuring
                            them into a step-by-step learning path.
                        </p>
                    </div>
                    <div className="overview-feature">
                        <h4 className="overview-feature-title">Progress Tracking</h4>
                        <p className="overview-feature-desc">
                            Mark subtopics as complete, track your progress with visual indicators,
                            and see your completed learning paths.
                        </p>
                    </div>
                    <div className="overview-feature">
                        <h4 className="overview-feature-title">Ask AI Anything</h4>
                        <p className="overview-feature-desc">
                            Stuck on a subtopic? Use the built-in AI chat to ask clarifying questions
                            and get instant, context-aware answers.
                        </p>
                    </div>
                    <div className="overview-feature">
                        <h4 className="overview-feature-title">Share and Import</h4>
                        <p className="overview-feature-desc">
                            Download your roadmaps as JSON files and share them with others.
                            Import roadmaps from JSON to start learning immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
