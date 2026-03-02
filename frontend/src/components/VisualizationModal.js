'use client';

export default function VisualizationModal({ html, subtopicTitle, onClose }) {
    return (
        <div className="viz-overlay" onClick={onClose}>
            <div className="viz-modal" onClick={function (e) { e.stopPropagation(); }}>
                <div className="viz-modal-header">
                    <div>
                        <h3 className="viz-modal-title">Interactive Visualization</h3>
                        <p className="viz-modal-subtitle">{subtopicTitle}</p>
                    </div>
                    <button onClick={onClose} className="viz-modal-close">&times;</button>
                </div>
                <div className="viz-modal-body">
                    <iframe
                        srcDoc={html}
                        className="viz-iframe"
                        sandbox="allow-scripts"
                        title={'Visualization: ' + subtopicTitle}
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
