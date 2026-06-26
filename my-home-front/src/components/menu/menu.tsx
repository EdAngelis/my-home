import { useContext, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import styles from "./menu.module.css";

export default function Menu() {
  const { setUserId } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hLogout = () => {
    setUserId("");
    localStorage.removeItem("buyerId");
    setOpen(false);
    navigate("/");
  };

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navBar}>
        <div className={styles.hamburgerWrapper} ref={menuRef}>
          <button
            className={styles.hamburger}
            onClick={() => setOpen((prev) => !prev)}
          >
            ☰
          </button>
          {open && (
            <div className={styles.popup}>
              <button className={styles.popupItem} onClick={hLogout}>
                Logout
              </button>
              <button
                className={styles.popupItem}
                onClick={() => goTo("/products")}
              >
                Market
              </button>
              <button
                className={styles.popupItem}
                onClick={() => goTo("/duties")}
              >
                Duties
              </button>
            </div>
          )}
        </div>
      </nav>
      <Outlet />
    </div>
  );
}
