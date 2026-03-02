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

export default function CompletedPathsPage() {
    const { user, loading: authLoading, authFetch } = useAuth();
    const router = useRouter();
    const [roadmaps, setRoadmaps] = useState([]);
    const [loading, setLoading] = useState(true);

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

    if (authLoading || loading) {
        return (
            <div className="page-loader">
                <div className="spinner"></div>
                <p>Loading completed paths...</p>
            </div>
        );
    }

    var completedRoadmaps = roadmaps.filter(function (r) { return isRoadmapComplete(r); });

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <Link href="/dashboard" className="back-btn">
                        &larr; Back to Dashboard
                    </Link>
                    <h1 className="dashboard-title">Completed Paths</h1>
                    <p className="dashboard-subtitle">
                        {completedRoadmaps.length > 0
                            ? `You have completed ${completedRoadmaps.length} learning path${completedRoadmaps.length > 1 ? 's' : ''}`
                            : 'No completed paths yet'}
                    </p>
                </div>
            </div>

            {completedRoadmaps.length === 0 ? (
                <div className="empty-state">
                    <h2>No completed paths yet</h2>
                    <p>Complete all subtopics in a learning path to see it here.</p>
                </div>
            ) : (
                <div className="roadmap-grid">
                    {completedRoadmaps.map(function (roadmap) {
                        return <RoadmapCard key={roadmap._id} roadmap={roadmap} />;
                    })}
                </div>
            )}
        </div>
    );
}
