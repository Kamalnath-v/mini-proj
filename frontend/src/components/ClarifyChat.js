'use client';

import { useState } from 'react';

const LLM_URL = 'http://localhost:5001/api/clarify';

export default function ClarifyChat({ subtopic }) {
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);

    async function handleAsk() {
        if (!question.trim() || loading) return;

        var userQ = question.trim();
        setMessages(function (prev) {
            return [...prev, { role: 'user', text: userQ }];
        });
        setQuestion('');
        setLoading(true);

        try {
            const res = await fetch(LLM_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtopic: { title: subtopic.title, description: subtopic.description },
                    question: userQ,
                }),
            });
            const data = await res.json();
            setMessages(function (prev) {
                return [...prev, { role: 'assistant', text: data.answer || 'Sorry, I could not answer that.' }];
            });
        } catch (err) {
            setMessages(function (prev) {
                return [...prev, { role: 'assistant', text: 'Error: Could not reach the AI server.' }];
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="clarify-chat">
            <h4 className="section-label">Ask a Question</h4>
            {messages.length > 0 && (
                <div className="clarify-messages">
                    {messages.map(function (msg, i) {
                        return (
                            <div key={i} className={`clarify-msg clarify-msg-${msg.role}`}>
                                <span className="clarify-msg-label">{msg.role === 'user' ? 'You' : 'AI'}</span>
                                <p className="clarify-msg-text">{msg.text}</p>
                            </div>
                        );
                    })}
                    {loading && (
                        <div className="clarify-msg clarify-msg-assistant">
                            <span className="clarify-msg-label">AI</span>
                            <p className="clarify-msg-text clarify-typing">Thinking...</p>
                        </div>
                    )}
                </div>
            )}
            <div className="clarify-input-row">
                <input
                    type="text"
                    className="form-input clarify-input"
                    placeholder={`Ask anything about "${subtopic.title}"...`}
                    value={question}
                    onChange={function (e) { setQuestion(e.target.value); }}
                    onKeyDown={function (e) { if (e.key === 'Enter') handleAsk(); }}
                    disabled={loading}
                />
                <button
                    onClick={handleAsk}
                    className="btn-clarify-send"
                    disabled={loading || !question.trim()}
                >
                    {loading ? '...' : 'Ask'}
                </button>
            </div>
        </div>
    );
}
