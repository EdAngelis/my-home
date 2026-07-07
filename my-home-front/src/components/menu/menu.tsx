import { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import { leaveHome } from "../../app.service";
import styles from "./menu.module.css";

const MARKET_PATHS = ["/products", "/cart", "/create-product"];
const DUTIES_PATHS = ["/duties", "/create-duty", "/categories", "/makers"];

export default function Menu() {
  const { qtItemCart, userId, setUserId, defaultHome, setDefaultHome } =
    useContext(AppContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  const hLeaveHome = async () => {
    try {
      await leaveHome(userId);
      setDefaultHome("");
      setOpen(false);
      navigate("/enter-home");
    } catch (error) {
      console.log(error);
    }
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
              {defaultHome && (
                <button className={styles.popupItem} onClick={hLeaveHome}>
                  Leave home
                </button>
              )}
            </div>
          )}
        </div>

        {MARKET_PATHS.includes(location.pathname) && (
          <>
            {userId === "" ? (
              <div className={styles.liDisabled}>PRODUCTS</div>
            ) : (
              <Link className={styles.li} to="/products">
                PRODUCTS
              </Link>
            )}

            {userId === "" ? (
              <div className={styles.liDisabled}>CART</div>
            ) : (
              <Link className={`${styles.li} ${styles.liCart}`} to="/cart">
                <div className={styles.badgeContainer}>
                  <div className={styles.badge}>{qtItemCart}</div>
                  <span>CART</span>
                </div>
              </Link>
            )}
          </>
        )}

        {DUTIES_PATHS.includes(location.pathname) && (
          <>
            <Link className={styles.li} to="/duties">
              DUTIES
            </Link>
            <Link className={styles.li} to="/categories">
              CATEGORIES
            </Link>
            <Link className={styles.li} to="/makers">
              MAKERS
            </Link>
          </>
        )}
      </nav>
      <Outlet />
    </div>
  );
}
