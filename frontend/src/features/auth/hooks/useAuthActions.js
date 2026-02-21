import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi, signupApi } from "../api/authApi";
import { useAuthStore } from "../../../store/authStore";
import { getApiErrorMessage } from "../../../utils/apiError";

export function useAuthActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const signIn = async (payload) => {
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
  };

  const signUp = async (payload) => {
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
  };

  return { signIn, signUp, isSubmitting, error };
}
