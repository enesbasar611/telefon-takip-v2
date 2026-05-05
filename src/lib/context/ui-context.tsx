"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UIContextType {
  isFinancialVisible: boolean;
  toggleFinancialVisibility: () => void;
  isLayoutEditing: boolean;
  toggleLayoutEditing: () => void;
  isAiLoading: boolean;
  setAiLoading: (v: boolean) => void;
  isAiInputFocused: boolean;
  setAiInputFocused: (v: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isFinancialVisible, setIsFinancialVisible] = useState(false);
  const [isLayoutEditing, setIsLayoutEditing] = useState(false);
  const [isAiLoading, setAiLoading] = useState(false);
  const [isAiInputFocused, setAiInputFocused] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedFinancial = localStorage.getItem("isFinancialVisible");
    if (savedFinancial !== null) {
      setIsFinancialVisible(JSON.parse(savedFinancial));
    }
    const savedLayout = localStorage.getItem("isLayoutEditing");
    if (savedLayout !== null) {
      setIsLayoutEditing(JSON.parse(savedLayout));
    }
  }, []);

  const toggleFinancialVisibility = () => {
    setIsFinancialVisible((prev) => {
      const newState = !prev;
      localStorage.setItem("isFinancialVisible", JSON.stringify(newState));
      return newState;
    });
  };

  const toggleLayoutEditing = () => {
    setIsLayoutEditing((prev) => {
      const newState = !prev;
      localStorage.setItem("isLayoutEditing", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <UIContext.Provider value={{
      isFinancialVisible,
      toggleFinancialVisibility,
      isLayoutEditing,
      toggleLayoutEditing,
      isAiLoading,
      setAiLoading,
      isAiInputFocused,
      setAiInputFocused
    }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}



