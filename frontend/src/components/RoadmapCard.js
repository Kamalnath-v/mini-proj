'use client';

import Link from 'next/link';

export default function RoadmapCard({ roadmap, onDelete }) {
    const date = new Date(roadmap.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    var totalSubtopics = 0;
    var completedSubtopics = 0;
    if (roadmap.topics) {
        roadmap.topics.forEach(function (topic) {
            topic.subtopics.forEach(function (subtopic) {
                totalSubtopics++;
                if (subtopic.completed) completedSubtopics++;
            });
        });
    }
    var progressPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;

    return (
        <div className="roadmap-card-wrapper">
            <Link href={`/dashboard/roadmap/${roadmap._id}`} className="roadmap-card">
                <div className="roadmap-card-header">
                    <h3 className="roadmap-card-title">{roadmap.title}</h3>
                    <span className="roadmap-card-date">{date}</span>
                </div>
                <p className="roadmap-card-desc">{roadmap.description}</p>
                <div className="progress-section">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: progressPercent + '%' }}></div>
                    </div>
                    <span className="progress-text">
                        {completedSubtopics}/{totalSubtopics} completed ({progressPercent}%)
                    </span>
                </div>
                <div className="roadmap-card-footer">
                    <span className="roadmap-card-cta">
                        View Details <span className="arrow">&rarr;</span>
                    </span>
                </div>
            </Link>
            {onDelete && (
                <button
                    className="btn-delete-roadmap"
                    onClick={function (e) {
                        e.stopPropagation();
                        onDelete(roadmap._id);
                    }}
                    title="Delete this learning path"
                >
                    &times;
                </button>
            )}
        </div>
    );
}
