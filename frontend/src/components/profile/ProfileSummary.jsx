import { Avatar } from "../common/Avatar";

export function ProfileSummary({ user }) {
  return (
    <section className="profile-card">
      <Avatar text={user?.avatar || "U"} size="lg" />
      <h2>{user?.name}</h2>
      <p>{user?.email}</p>
    </section>
  );
}
