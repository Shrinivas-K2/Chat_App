import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/common/Button";
import { useAuthStore } from "../../../store/authStore";
import { setGenderApi } from "../api/userApi";
import { getApiErrorMessage } from "../../../utils/apiError";

const OPTIONS = ["MALE", "FEMALE", "OTHER"];

export function GenderOnboardingPage() {
  const navigate = useNavigate();
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const user = useAuthStore((state) => state.user);

  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!gender) {
      setError("Please select your gender.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await setGenderApi({
        gender,
        dateOfBirth: dateOfBirth || null,
      });

      updateProfile(data.user);
      navigate("/chat", { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save gender."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h1>One More Step</h1>
        <p>
          Hi {user?.name || "there"}, select your gender to continue. This can only be set once.
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Gender</span>
            <select
              className="field-input"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              required
            >
              <option value="">Select gender</option>
              {OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Date of Birth (optional)</span>
            <input
              className="field-input"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
