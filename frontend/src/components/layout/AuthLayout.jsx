import { Link } from "react-router-dom";

export function AuthLayout({ title, subtitle, children, alternateText, alternateLink, alternateLabel }) {
  return (
    <div className="auth-page">
      <section className="auth-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
        <div className="auth-card">{children}</div>
        <p className="auth-alt">
          {alternateText} <Link to={alternateLink}>{alternateLabel}</Link>
        </p>
      </section>
      <section className="auth-right">
        <h2>Realtime Chat Application</h2>
        <p>Secure messaging, groups, files, notifications, and presence in one platform.</p>
      </section>
    </div>
  );
}
