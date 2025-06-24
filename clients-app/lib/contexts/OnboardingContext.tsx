"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "../AuthContext";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  component?: string;
  completed: boolean;
  optional?: boolean;
}

interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  steps: OnboardingStep[];
  hasCompletedOnboarding: boolean;
  lastActiveDate: string | null;
}

interface OnboardingContextType {
  state: OnboardingState;
  startOnboarding: (forceRestart?: boolean) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeStep: (stepId: string) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
  isStepCompleted: (stepId: string) => boolean;
  getProgress: () => number;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to GreenTrade! 🌱",
    description:
      "Welcome to your green energy trading platform! This quick tour will show you the key features and help you get started with sustainable energy trading.",
    target: "body",
    completed: false,
  },
  {
    id: "navigation-tour",
    title: "Navigation Sidebar 📋",
    description:
      "The sidebar on the left is your main navigation. Use it to access: Dashboard (overview), Market (live data), Orders (trading), and Education (learning resources).",
    target: "body",
    completed: false,
  },
  {
    id: "dashboard-overview",
    title: "Dashboard Overview 📊",
    description:
      "You're currently on the Dashboard - your command center! Here you'll see portfolio stats, market updates, and quick actions. This gives you everything at a glance.",
    target: "body",
    completed: false,
  },
  {
    id: "orders-guide",
    title: "Start Trading 💰",
    description:
      "Ready to trade? Click 'Orders' in the sidebar, then look for 'New Order' buttons to create buy/sell orders for green energy certificates. Easy and secure!",
    target: "body",
    completed: false,
  },
  {
    id: "help-access",
    title: "Need Help? 🆘",
    description:
      "Anytime you need assistance, look for the green help button in the bottom-right corner of your dashboard. It's always there when you need it!",
    target: "body",
    completed: false,
    optional: true,
  },
  {
    id: "ready-to-start",
    title: "You're Ready to Trade! 🚀",
    description:
      "Perfect! You're all set to explore sustainable energy trading. Start with the Market section for live prices, then create your first order. Happy green trading! 🌿✨",
    target: "body",
    completed: false,
  },
];

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [state, setState] = useState<OnboardingState>({
    isActive: false,
    currentStep: 0,
    steps: DEFAULT_STEPS,
    hasCompletedOnboarding: false,
    lastActiveDate: null,
  });

  // Load onboarding state from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`onboarding_${user.id}`);
      if (saved) {
        try {
          const savedState = JSON.parse(saved);
          setState((prev) => ({
            ...prev,
            ...savedState,
            isActive: false, // Never auto-start
          }));
        } catch (error) {
          console.error("Failed to load onboarding state:", error);
        }
      }
    }
  }, [user]);

  // Save onboarding state to localStorage
  const saveState = (newState: OnboardingState) => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(newState));
    }
  };

  const startOnboarding = (forceRestart = false) => {
    const newState = {
      ...state,
      isActive: true,
      currentStep: forceRestart ? 0 : state.currentStep,
      steps: forceRestart ? DEFAULT_STEPS : state.steps,
      lastActiveDate: new Date().toISOString(),
    };
    setState(newState);
    saveState(newState);
  };

  const nextStep = () => {
    if (state.currentStep < state.steps.length - 1) {
      const newState = {
        ...state,
        currentStep: state.currentStep + 1,
      };
      setState(newState);
      saveState(newState);
    } else {
      // Complete onboarding
      const newState = {
        ...state,
        isActive: false,
        hasCompletedOnboarding: true,
      };
      setState(newState);
      saveState(newState);
    }
  };

  const prevStep = () => {
    if (state.currentStep > 0) {
      const newState = {
        ...state,
        currentStep: state.currentStep - 1,
      };
      setState(newState);
      saveState(newState);
    }
  };

  const completeStep = (stepId: string) => {
    const newSteps = state.steps.map((step) =>
      step.id === stepId ? { ...step, completed: true } : step
    );
    const newState = {
      ...state,
      steps: newSteps,
    };
    setState(newState);
    saveState(newState);
  };

  const skipOnboarding = () => {
    const newState = {
      ...state,
      isActive: false,
      hasCompletedOnboarding: true,
    };
    setState(newState);
    saveState(newState);
  };

  const resetOnboarding = () => {
    const newState = {
      isActive: false,
      currentStep: 0,
      steps: DEFAULT_STEPS,
      hasCompletedOnboarding: false,
      lastActiveDate: null,
    };
    setState(newState);
    if (user) {
      localStorage.removeItem(`onboarding_${user.id}`);
    }
  };

  const isStepCompleted = (stepId: string) => {
    return state.steps.find((step) => step.id === stepId)?.completed || false;
  };

  const getProgress = () => {
    const completedSteps = state.steps.filter((step) => step.completed).length;
    return Math.round((completedSteps / state.steps.length) * 100);
  };

  return (
    <OnboardingContext.Provider
      value={{
        state,
        startOnboarding,
        nextStep,
        prevStep,
        completeStep,
        skipOnboarding,
        resetOnboarding,
        isStepCompleted,
        getProgress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
