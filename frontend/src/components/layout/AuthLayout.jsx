import { Link } from "react-router-dom";

export function AuthLayout({
  title,
  subtitle,
  children,
  alternateText,
  alternateLink,
  alternateLabel,
  promo,
}) {
  const videoSrc =
    "https://videos.pexels.com/video-files/3195650/3195650-hd_1920_1080_25fps.mp4";

  return (
    <div className="auth-page">
      <section className="auth-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        {promo ? (
          <article className="auth-inline-promo">
            {promo.kicker ? <p className="auth-inline-kicker">{promo.kicker}</p> : null}
            {promo.title ? <h3>{promo.title}</h3> : null}
            {promo.description ? <p className="auth-inline-desc">{promo.description}</p> : null}
            {Array.isArray(promo.points) && promo.points.length > 0 ? (
              <ul className="auth-inline-list">
                {promo.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ) : null}
        <div className="auth-card">{children}</div>
        <p className="auth-alt">
          {alternateText} <Link to={alternateLink}>{alternateLabel}</Link>
        </p>
      </section>
      <section className="auth-right">
        <video className="auth-right-video" src={videoSrc} autoPlay muted loop playsInline />
        <div className="auth-right-overlay" />
        <div className="auth-right-aurora" />
        <div className="auth-right-content">
          <p className="auth-kicker">Talk Better. Feel Closer.</p>
          <h2>
            Conversations that feel
            <span> instant, private, and human.</span>
          </h2>
          <p className="auth-quote">
            "A great platform does not just deliver messages. It delivers trust, clarity, and
            connection every second."
          </p>

          <div className="auth-value-grid">
            <article className="auth-value-card">
              <h3>Real-Time Flow</h3>
              <p>Zero-lag chat experience for direct and group conversations.</p>
            </article>
            <article className="auth-value-card">
              <h3>Built on Trust</h3>
              <p>Secure auth, private rooms, controlled access, and clean data boundaries.</p>
            </article>
            <article className="auth-value-card">
              <h3>Always in Sync</h3>
              <p>Presence, typing, notifications, and delivery states that feel truly live.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
