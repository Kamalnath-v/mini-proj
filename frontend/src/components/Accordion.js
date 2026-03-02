'use client';

import { useState } from 'react';

export default function Accordion({ title, subtitle, badge, children, defaultOpen = false, completed = false }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`accordion ${isOpen ? 'accordion-open' : ''} ${completed ? 'accordion-completed' : ''}`}>
            <button
                className="accordion-header"
                onClick={function () {
                    setIsOpen(!isOpen);
                }}
            >
                <div className="accordion-header-content">
                    <span className={`accordion-chevron ${isOpen ? 'chevron-open' : ''}`}>&#9656;</span>
                    <div>
                        <span className="accordion-title">
                            {completed && <span className="completed-check">&#10003;</span>}
                            {title}
                        </span>
                        {subtitle && <p className="accordion-subtitle">{subtitle}</p>}
                    </div>
                </div>
                {badge && <span className={`accordion-badge ${completed ? 'accordion-badge-done' : ''}`}>{completed ? 'Completed' : badge}</span>}
            </button>
            <div className={`accordion-body ${isOpen ? 'accordion-body-open' : ''}`}>
                <div className="accordion-body-inner">{children}</div>
            </div>
        </div>
    );
}
