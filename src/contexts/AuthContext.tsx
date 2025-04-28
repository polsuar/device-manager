import { createContext, useContext, ReactNode } from "react";

interface AuthContextType {
  user: {
    email: string;
    uid: string;
  };
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const signIn = async (email: string, password: string) => {
    // Implementación temporal
    console.log("Sign in:", email, password);
  };

  const signOut = async () => {
    // Implementación temporal
    console.log("Sign out");
  };

  return <AuthContext.Provider value={{ user: { email: "test@example.com", uid: "test-user-id" }, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
