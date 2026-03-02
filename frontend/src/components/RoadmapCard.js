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
    var topicCount = 0;
    if (roadmap.topics) {
        topicCount = roadmap.topics.length;
        roadmap.topics.forEach(function (topic) {
            topic.subtopics.forEach(function (subtopic) {
                totalSubtopics++;
                if (subtopic.completed) completedSubtopics++;
            });
        });
    }
    var progressPercent = totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0;
    var isComplete = totalSubtopics > 0 && completedSubtopics === totalSubtopics;

    return (
        <div className={'roadmap-card-wrapper' + (isComplete ? ' roadmap-card-complete' : '')}>
            <Link href={`/dashboard/roadmap/${roadmap._id}`} className="roadmap-card">
                <div className="roadmap-card-top-row">
                    <span className={'roadmap-card-status-dot' + (isComplete ? ' status-done' : ' status-active')}></span>
                    <span className="roadmap-card-topic-badge">{topicCount} {topicCount === 1 ? 'topic' : 'topics'}</span>
                </div>
                <h3 className="roadmap-card-title">{roadmap.title}</h3>
                <p className="roadmap-card-desc">{roadmap.description}</p>
                <div className="roadmap-card-progress">
                    <div className="roadmap-card-progress-header">
                        <span className="roadmap-card-progress-label">Progress</span>
                        <span className="roadmap-card-progress-pct">{progressPercent}%</span>
                    </div>
                    <div className="progress-bar progress-bar-card">
                        <div className="progress-fill" style={{ width: progressPercent + '%' }}></div>
                    </div>
                    <span className="roadmap-card-progress-detail">
                        {completedSubtopics} of {totalSubtopics} subtopics completed
                    </span>
                </div>
                <div className="roadmap-card-footer">
                    <span className="roadmap-card-date">{date}</span>
                    <span className="roadmap-card-cta">
                        Open <span className="arrow">&rarr;</span>
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
