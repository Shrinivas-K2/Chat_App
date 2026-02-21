import { AuthLayout } from "../../../components/layout/AuthLayout";
import { AuthForm } from "../components/AuthForm";
import { useAuthActions } from "../hooks/useAuthActions";

export function LoginPage() {
  const { signIn, isSubmitting, error } = useAuthActions();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue your conversations"
      alternateText="Need an account?"
      alternateLink="/signup"
      alternateLabel="Sign up"
    >
      <AuthForm type="login" onSubmit={signIn} isSubmitting={isSubmitting} error={error} />
    </AuthLayout>
  );
}
