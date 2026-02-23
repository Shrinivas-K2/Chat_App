import { AuthLayout } from "../../../components/layout/AuthLayout";
import { AuthForm } from "../components/AuthForm";
import { useAuthActions } from "../hooks/useAuthActions";

export function SignupPage() {
  const { signUp, signInWithGoogle, isSubmitting, error } = useAuthActions();

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join and start realtime messaging"
      alternateText="Already have an account?"
      alternateLink="/login"
      alternateLabel="Login"
    >
      <AuthForm
        type="signup"
        onSubmit={signUp}
        onGoogleAuth={signInWithGoogle}
        isSubmitting={isSubmitting}
        error={error}
      />
    </AuthLayout>
  );
}
