import { useContext } from "react";
import { Link, Outlet } from "react-router-dom";
import { AppContext } from "../../context";
import styles from "./market-nav.module.css";

export default function MarketNav() {
  const { qtItemCart, userId } = useContext(AppContext);

  return (
    <>
      <nav className={styles.navBar}>
        {userId === "" ? (
          <div className={styles.liDisabled}>PRODUTOS</div>
        ) : (
          <Link className={styles.li} to="/products">
            PRODUTOS
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
      </nav>
      <Outlet />
    </>
  );
}
