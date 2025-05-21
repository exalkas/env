"use client";

import React, { useState } from "react";
import { LoginForm, SignupForm } from "../../components/AuthForms";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  // If user is already authenticated, redirect to the home page
  if (user) {
    router.push("/");
    return null;
  }

  const handleSuccess = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        {isLogin ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitch={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            onSuccess={handleSuccess}
            onSwitch={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  );
}
