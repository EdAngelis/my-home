import { createContext, useState } from "react";
import IHome from "./models/home.model";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: any) {
  const [userId, setUserId] = useState<string>(
    () => localStorage.getItem("buyerId") || ""
  );
  const [qtItemCart, setQtItemCart] = useState<number>(0);
  const [homes, setHomes] = useState<IHome[]>([]);
  const [defaultHome, setDefaultHome] = useState<string>("");
  return (
    <AppContext.Provider
      value={{
        qtItemCart,
        userId,
        setUserId,
        setQtItemCart,
        homes,
        setHomes,
        defaultHome,
        setDefaultHome,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
