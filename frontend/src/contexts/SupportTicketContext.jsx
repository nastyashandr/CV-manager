import { createContext, useContext, useState, useCallback } from "react";

const SupportTicketContext = createContext(null);

export function SupportTicketProvider({ children }) {
  const [positionTitle, setPositionTitleState] = useState(null);

  const setPositionTitle = useCallback((title) => {
    setPositionTitleState(title || null);
  }, []);

  const clearPositionTitle = useCallback(() => {
    setPositionTitleState(null);
  }, []);

  return (
    <SupportTicketContext.Provider
      value={{ positionTitle, setPositionTitle, clearPositionTitle }}
    >
      {children}
    </SupportTicketContext.Provider>
  );
}

export function useSupportTicketContext() {
  const ctx = useContext(SupportTicketContext);
  if (!ctx) {
    throw new Error(
      "useSupportTicketContext must be used within a SupportTicketProvider",
    );
  }
  return ctx;
}
