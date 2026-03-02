'use client';

import { useState } from 'react';

export default function QuizCard({ question, index }) {
    const [selected, setSelected] = useState(null);
    const [showResult, setShowResult] = useState(false);

    function handleSelect(optionIndex) {
        if (showResult) return;
        setSelected(optionIndex);
        setShowResult(true);
    }

    const isCorrect = selected === question.correctAnswer;

    return (
        <div className="quiz-card">
            <p className="quiz-question">
                <span className="quiz-number">Q{index + 1}.</span> {question.question}
            </p>
            <div className="quiz-options">
                {question.options.map(function (option, i) {
                    let optionClass = 'quiz-option';
                    if (showResult) {
                        if (i === question.correctAnswer) optionClass += ' quiz-option-correct';
                        else if (i === selected) optionClass += ' quiz-option-wrong';
                    } else if (i === selected) {
                        optionClass += ' quiz-option-selected';
                    }

                    return (
                        <button
                            key={i}
                            className={optionClass}
                            onClick={function () {
                                handleSelect(i);
                            }}
                        >
                            <span className="quiz-option-letter">
                                {String.fromCharCode(65 + i)}
                            </span>
                            {option}
                        </button>
                    );
                })}
            </div>
            {showResult && (
                <p className={`quiz-result ${isCorrect ? 'quiz-result-correct' : 'quiz-result-wrong'}`}>
                    {isCorrect ? '✓ Correct!' : `✗ Incorrect. The answer is ${String.fromCharCode(65 + question.correctAnswer)}.`}
                </p>
            )}
        </div>
    );
}
