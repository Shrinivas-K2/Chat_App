import { Link } from "react-router-dom";

export function LandingPage() {
  return (
    <div className="landing-page">
      <div className="landing-bg-orb landing-bg-orb-one" aria-hidden="true" />
      <div className="landing-bg-orb landing-bg-orb-two" aria-hidden="true" />
      <div className="landing-grid" aria-hidden="true" />

      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          Chat App
        </Link>

        <nav className="landing-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="#privacy">Privacy</a>
          <a href="#community">Community</a>
        </nav>

        <div className="landing-nav-actions">
          <Link className="landing-btn landing-btn-ghost" to="/login">
            Login
          </Link>
          <Link className="landing-btn landing-btn-solid" to="/signup">
            Sign up
          </Link>
        </div>
      </header>

      <main className="landing-hero">
        <p className="landing-kicker">Private. Fast. Human.</p>
        <h1>
          Stop boring chats.
          <span>Start real conversations with secure messaging.</span>
        </h1>
        <p className="landing-subtitle">
          Meet random people, build private encrypted conversations, and run open group chats with
          a modern real-time experience.
        </p>

        <div className="landing-cta-row">
          <Link className="landing-btn landing-btn-cta" to="/signup">
            Let&apos;s Start
          </Link>
          <Link className="landing-btn landing-btn-glass" to="/login">
            I already have an account
          </Link>
        </div>

        <section className="landing-feature-strip" id="features">
          <article>
            <h3>Random Discovery</h3>
            <p>Find people quickly and begin a new chat instantly.</p>
          </article>
          <article id="privacy">
            <h3>Secure and Encrypted</h3>
            <p>Private 1-to-1 conversations with strong trust boundaries.</p>
          </article>
          <article id="community">
            <h3>Open Group Spaces</h3>
            <p>Create communities, discuss openly, and stay in sync live.</p>
          </article>
        </section>
      </main>
    </div>
  );
}
