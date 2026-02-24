import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "../../../components/common/Button";
import { InputField } from "../../../components/common/InputField";
import { Loader } from "../../../components/common/Loader";
import { AuthLayout } from "../../../components/layout/AuthLayout";
import { resendVerificationApi, verifyEmailApi } from "../api/authApi";
import { getApiErrorMessage } from "../../../utils/apiError";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const token = String(searchParams.get("token") || "").trim();
  const initialEmail = String(searchParams.get("email") || "").trim();
  const verifyMessageFromState = String(location.state?.message || "").trim();
  const [email, setEmail] = useState(initialEmail);
  const [verifyStatus, setVerifyStatus] = useState(token ? "idle" : "missing");
  const [verifyMessage, setVerifyMessage] = useState(verifyMessageFromState);
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const lastVerifiedTokenRef = useRef("");

  useEffect(() => {
    if (!token || token === lastVerifiedTokenRef.current) {
      return;
    }

    lastVerifiedTokenRef.current = token;
    setIsVerifying(true);
    setVerifyStatus("loading");
    setVerifyError("");

    verifyEmailApi({ token })
      .then((data) => {
        setVerifyStatus("success");
        setVerifyMessage(data?.message || "Email verified successfully.");
        if (data?.email && !email) {
          setEmail(String(data.email));
        }
      })
      .catch((error) => {
        setVerifyStatus("error");
        setVerifyError(getApiErrorMessage(error, "Unable to verify this link right now."));
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [token, email]);

  const handleResend = async (event) => {
    event.preventDefault();

    setIsResending(true);
    setResendMessage("");
    setResendError("");

    try {
      const data = await resendVerificationApi({ email });
      setResendMessage(data?.message || "Verification email sent.");
    } catch (error) {
      setResendError(getApiErrorMessage(error, "Unable to resend verification right now."));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Confirm your mailbox to activate account login."
      alternateText="Already verified?"
      alternateLink="/login"
      alternateLabel="Login"
    >
      <div className="auth-form">
        {isVerifying ? <p className="info-text">Verifying your link...</p> : null}

        {!isVerifying && verifyMessage ? <p className="success-text">{verifyMessage}</p> : null}

        {!isVerifying && verifyError ? <p className="error-text">{verifyError}</p> : null}

        {verifyStatus !== "success" ? (
          <form className="auth-form" onSubmit={handleResend}>
            <InputField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@email.com"
              required
            />

            {resendError ? <p className="error-text">{resendError}</p> : null}
            {resendMessage ? <p className="success-text">{resendMessage}</p> : null}

            <Button type="submit" disabled={isResending || !email.trim()}>
              {isResending ? <Loader /> : "Resend Verification Email"}
            </Button>
          </form>
        ) : (
          <Link to="/login">Continue to login</Link>
        )}
      </div>
    </AuthLayout>
  );
}
