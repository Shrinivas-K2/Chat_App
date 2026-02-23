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
      setError(getApiErrorMessage(err, "Unable to login right now."));
    } finally {
      setIsSubmitting(false);
    }
  }, [login, navigate]);

  const signUp = useCallback(async (payload) => {
    setIsSubmitting(true);
    setError("");
    try {
      await signupApi(payload);
      navigate("/login");
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
