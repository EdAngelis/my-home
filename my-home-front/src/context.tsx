import { createContext, useState, useEffect } from "react";
import IHome from "./models/home.model";
import { getBuyer } from "./app.service";

export const AppContext = createContext<any>(null);

export function AppProvider({ children }: any) {
  const [userId, setUserId] = useState<string>(
    () => localStorage.getItem("buyerId") || ""
  );
  const [qtItemCart, setQtItemCart] = useState<number>(0);
  const [homes, setHomes] = useState<IHome[]>([]);
  const [defaultHome, setDefaultHome] = useState<string>("");
  const [homeLoading, setHomeLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      setDefaultHome("");
      setHomeLoading(false);
      return;
    }
    setHomeLoading(true);
    getBuyer(userId)
      .then((buyer) => setDefaultHome(buyer?.defaultHome || ""))
      .catch(() => setDefaultHome(""))
      .finally(() => setHomeLoading(false));
  }, [userId]);

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
        homeLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
