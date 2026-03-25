"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UIContextType {
  isFinancialVisible: boolean;
  toggleFinancialVisibility: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isFinancialVisible, setIsFinancialVisible] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("isFinancialVisible");
    if (saved !== null) {
      setIsFinancialVisible(JSON.parse(saved));
    }
  }, []);

  const toggleFinancialVisibility = () => {
    setIsFinancialVisible((prev) => {
      const newState = !prev;
      localStorage.setItem("isFinancialVisible", JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <UIContext.Provider value={{ isFinancialVisible, toggleFinancialVisibility }}>
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
