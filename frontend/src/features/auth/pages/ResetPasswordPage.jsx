import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { Button } from "../../../components/common/Button";
import { InputField } from "../../../components/common/InputField";
import { Loader } from "../../../components/common/Loader";
import { resetPasswordApi } from "../api/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = String(searchParams.get("token") || "").trim();
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Invalid reset link. Please request a new password reset email.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await resetPasswordApi({ token, password: form.password });
      setSuccessMessage(data?.message || "Password reset successful. You can login now.");
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err, "Unable to reset password right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Set a new password for your Chat App account."
      alternateText="Need a new link?"
      alternateLink="/forgot-password"
      alternateLabel="Forgot password"
    >
      {!token ? (
        <div className="auth-form">
          <p className="error-text">This reset link is invalid or missing.</p>
          <Link to="/forgot-password">Request a new reset link</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="New Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Minimum 6 characters"
            required
          />

          <InputField
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
          />

          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !form.password.trim() ||
              !form.confirmPassword.trim() ||
              Boolean(successMessage)
            }
          >
            {isSubmitting ? <Loader /> : "Reset Password"}
          </Button>

          {successMessage ? <Link to="/login">Continue to login</Link> : null}
        </form>
      )}
    </AuthLayout>
  );
}
