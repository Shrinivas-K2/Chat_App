import { AuthLayout } from "../../../components/layout/AuthLayout";
import { AuthForm } from "../components/AuthForm";
import { useAuthActions } from "../hooks/useAuthActions";

export function LoginPage() {
  const { signIn, signInWithGoogle, isSubmitting, error } = useAuthActions();

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to continue your conversations"
      alternateText="Need an account?"
      alternateLink="/signup"
      alternateLabel="Sign up"
      promo={{
        kicker: "Why Chat App",
        title: "No more boring chats.",
        description:
          "Meet new people, chat instantly, and keep every message secure with modern encryption.",
        points: [
          "Discover random people and start conversations in seconds.",
          "Private 1-to-1 messaging with encrypted text.",
          "Open group chats for communities, study circles, and teams.",
        ],
      }}
    >
      <AuthForm
        type="login"
        onSubmit={signIn}
        onGoogleAuth={signInWithGoogle}
        isSubmitting={isSubmitting}
        error={error}
      />
    </AuthLayout>
  );
}
