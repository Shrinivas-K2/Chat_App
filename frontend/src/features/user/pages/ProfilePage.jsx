import { useState } from "react";
import { MainLayout } from "../../../components/layout/MainLayout";
import { ProfileSummary } from "../../../components/profile/ProfileSummary";
import { InputField } from "../../../components/common/InputField";
import { Button } from "../../../components/common/Button";
import { useAuthStore } from "../../../store/authStore";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    updateProfile(form);
  };

  return (
    <MainLayout>
      <div className="profile-page">
        <ProfileSummary user={user} />

        <form className="profile-form" onSubmit={handleSubmit}>
          <h3>Profile Management</h3>
          <InputField
            label="Name"
            name="name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <InputField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <div className="readonly-field">
            <span className="field-label">Gender</span>
            <div className="readonly-value">{user?.gender || "Not set"}</div>
            {user?.gender ? (
              <small className="readonly-note">Gender is locked after initial setup.</small>
            ) : null}
          </div>
          <Button type="submit">Save Profile</Button>
        </form>
      </div>
    </MainLayout>
  );
}
