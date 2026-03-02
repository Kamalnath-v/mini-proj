import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <h1 className="hero-title">
          Your Personalized
          <span className="hero-gradient"> Learning Path</span>
        </h1>
        <p className="hero-subtitle">
          Generate structured learning roadmaps, explore curated resources, and test your knowledge
          with interactive quizzes.
        </p>
        <div className="hero-actions">
          <Link href="/signup" className="hero-btn-primary">
            Get Started
          </Link>
          <Link href="/login" className="hero-btn-secondary">
            Sign In
          </Link>
        </div>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3 className="feature-title">Structured Roadmaps</h3>
          <p className="feature-desc">
            Generate comprehensive learning paths with topics, subtopics, and curated resources.
          </p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Curated Resources</h3>
          <p className="feature-desc">
            Each subtopic comes with hand-picked articles, tutorials, and documentation links.
          </p>
        </div>
        <div className="feature-card">
          <h3 className="feature-title">Interactive Quizzes</h3>
          <p className="feature-desc">
            Test your understanding with auto-generated multiple choice questions per subtopic.
          </p>
        </div>
      </div>
    </div>
  );
}
