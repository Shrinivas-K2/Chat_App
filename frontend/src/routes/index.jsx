import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { VerifyEmailPage } from "../features/auth/pages/VerifyEmailPage";
import { LandingPage } from "../features/auth/pages/LandingPage";
import { ChatPage } from "../features/chat/pages/ChatPage";
import { ProfilePage } from "../features/user/pages/ProfilePage";
import { GenderOnboardingPage } from "../features/user/pages/GenderOnboardingPage";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { PublicOnlyRoute } from "./guards/PublicOnlyRoute";
import { RequireGenderRoute } from "./guards/RequireGenderRoute";
import { GenderSetupOnlyRoute } from "./guards/GenderSetupOnlyRoute";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      <Route path="/verify-email" element={<VerifyEmailPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<GenderSetupOnlyRoute />}>
          <Route path="/onboarding/gender" element={<GenderOnboardingPage />} />
        </Route>

        <Route element={<RequireGenderRoute />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
