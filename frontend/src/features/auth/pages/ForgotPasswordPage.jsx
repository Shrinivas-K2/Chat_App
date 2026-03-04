import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { Button } from "../../../components/common/Button";
import { InputField } from "../../../components/common/InputField";
import { Loader } from "../../../components/common/Loader";
import { requestPasswordResetApi } from "../api/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const data = await requestPasswordResetApi({ email });
      setMessage(data?.message || "If the account exists, a reset link has been sent.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to process your request right now."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your account email and we will send you a password reset link."
      alternateText="Remembered your password?"
      alternateLink="/login"
      alternateLabel="Login"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <InputField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="example@email.com"
          required
        />

        {error ? <p className="error-text">{error}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}

        <Button type="submit" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? <Loader /> : "Send Reset Link"}
        </Button>

        {message ? <Link to="/login">Back to login</Link> : null}
      </form>
    </AuthLayout>
  );
}
