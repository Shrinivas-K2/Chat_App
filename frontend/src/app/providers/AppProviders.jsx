import { AuthProvider } from "../../providers/AuthProvider";
import { SocketProvider } from "../../providers/SocketProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <SocketProvider>{children}</SocketProvider>
    </AuthProvider>
  );
}
