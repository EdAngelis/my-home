import { createContext, useState } from "react";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: any) {
  const [userId, setUserId] = useState<string>("");
  const [qtItemCart, setQtItemCart] = useState<number>(0);
  return (
    <AppContext.Provider
      value={{ qtItemCart, userId, setUserId, setQtItemCart }}
    >
      {children}
    </AppContext.Provider>
  );
}
