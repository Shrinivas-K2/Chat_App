import { useState } from "react";
import { Link } from "react-router-dom";

const FEATURE_POINTS = [
  "Discover and connect with random users instantly.",
  "Secure private 1-to-1 conversations with clean access control.",
  "Public group chats for open discussions and communities.",
  "Live typing, seen status, and unread message indicators.",
  "Google login and email verification based signup flow.",
];

const PRIVACY_POINTS = [
  "Private 1-to-1 rooms use authenticated access and controlled membership.",
  "Google and email verification reduce fake-account abuse and spam joins.",
  "User sessions are token-based with secure server-side validation.",
  "Profile-level controls keep your conversations and identity protected.",
];

const FAQ_ITEMS = [
  {
    question: "Is chat messaging private and secure?",
    answer:
      "Yes. The platform is built with secure auth, controlled room access, and encrypted message handling patterns for private communication.",
  },
  {
    question: "Can I chat with random people?",
    answer:
      "Yes. You can discover connected users quickly and send private chat requests to start conversations in seconds.",
  },
  {
    question: "How do group chats work?",
    answer:
      "You can create public groups, invite members, and chat in real time with delivery updates and live presence.",
  },
  {
    question: "Can I use Google login and normal signup together?",
    answer:
      "Yes. Google sign-in is supported, and email/password signup works with verification flow for safer account access.",
  },
];

export function LandingPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const year = new Date().getFullYear();

  const scrollToSection = (sectionId) => (event) => {
    event.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

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
          <a href="#features" onClick={scrollToSection("features")}>
            Features
          </a>
          <a href="#privacy" onClick={scrollToSection("privacy")}>
            Privacy
          </a>
          <a href="#faq" onClick={scrollToSection("faq")}>
            FAQ
          </a>
          <a href="#contact" onClick={scrollToSection("contact")}>
            Contact
          </a>
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
      </main>

      <section className="landing-feature-board" id="features">
        <p className="landing-section-kicker">Core Features</p>
        <h2>Everything You Need For Modern Realtime Chat</h2>
        <ul>
          {FEATURE_POINTS.map((point) => (
            <li key={point}>
              <span className="landing-feature-dot" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-privacy-board" id="privacy">
        <p className="landing-section-kicker">Privacy</p>
        <h2>Built With Security-First Messaging Principles</h2>
        <ul>
          {PRIVACY_POINTS.map((point) => (
            <li key={point}>
              <span className="landing-feature-dot" aria-hidden="true" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-faq" id="faq">
        <p className="landing-section-kicker">Questions</p>
        <h2>Frequently Asked Questions</h2>
        <div className="landing-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = index === openFaqIndex;
            return (
              <article key={item.question} className={`landing-faq-item ${isOpen ? "open" : ""}`}>
                <button
                  className="landing-faq-question"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                  type="button"
                  aria-expanded={isOpen}
                >
                  <span>{item.question}</span>
                  <span className={`landing-faq-toggle ${isOpen ? "open" : ""}`} aria-hidden="true">
                    v
                  </span>
                </button>
                <div className="landing-faq-answer-wrap">
                  <p className="landing-faq-answer">{item.answer}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="landing-section-divider" aria-hidden="true" />

      <footer className="landing-footer landing-footer-clean" id="contact">
        <div className="landing-footer-brand">
          <h3>Chat App</h3>
          <p>Secure private chats, open communities, and real-time conversations at scale.</p>
        </div>

        <div className="landing-footer-links">
          <div>
            <h4>Address</h4>
            <p>Bengaluru, Karnataka</p>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:shrinivasa242004@gmail.com">Gmail</a>
          </div>
          <div>
            <h4>Explore</h4>
            <a href="#features" onClick={scrollToSection("features")}>
              Features
            </a>
            <a href="#privacy" onClick={scrollToSection("privacy")}>
              Privacy
            </a>
            <a href="#faq" onClick={scrollToSection("faq")}>
              FAQ
            </a>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign up</Link>
          </div>
        </div>

        <p className="landing-footer-copy">(c) {year} Chat App. Built for real conversations.</p>
      </footer>
    </div>
  );
}
