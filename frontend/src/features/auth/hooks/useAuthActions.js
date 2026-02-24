import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthApi, loginApi, signupApi } from "../api/authApi";
import { useAuthStore } from "../../../store/authStore";
import { getApiErrorMessage } from "../../../utils/apiError";

export function useAuthActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const signIn = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const data = await loginApi(payload);
      login(data);
      navigate(data.user?.gender ? "/chat" : "/onboarding/gender");
    } catch (err) {
      const requiresEmailVerification = Boolean(err?.response?.data?.requiresEmailVerification);

      if (requiresEmailVerification) {
        const email = String(err?.response?.data?.email || payload?.email || "").trim();
        const params = new URLSearchParams();

        if (email) {
          params.set("email", email);
        }

        navigate(`/verify-email${params.toString() ? `?${params.toString()}` : ""}`, {
          state: {
            message: "Email is not verified yet. Please verify first.",
          },
        });
        return;
      }

      setError(getApiErrorMessage(err, "Unable to login right now."));
    } finally {
      setIsSubmitting(false);
    }
  }, [login, navigate]);

  const signUp = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      const data = await signupApi(payload);
      const email = String(payload?.email || "").trim();
      const params = new URLSearchParams();

      if (email) {
        params.set("email", email);
      }

      navigate(`/verify-email${params.toString() ? `?${params.toString()}` : ""}`, {
        replace: true,
        state: {
          message: data?.message || "Account created. Check your email for verification.",
        },
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to create account right now."));
    } finally {
      setIsSubmitting(false);
    }
  }, [navigate]);

  const signInWithGoogle = useCallback(async (credential) => {
    setIsSubmitting(true);
    setError("");
    try {
      const data = await googleAuthApi({ idToken: credential });
      login(data);
      navigate(data.user?.gender ? "/chat" : "/onboarding/gender");
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to continue with Google right now."));
    } finally {
      setIsSubmitting(false);
    }
  }, [login, navigate]);

  return { signIn, signUp, signInWithGoogle, isSubmitting, error };
}
