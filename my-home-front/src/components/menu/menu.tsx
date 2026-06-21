import { useContext, useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { AppContext } from "../../context";
import styles from "./menu.module.css";

export default function Menu() {
  const { qtItemCart, userId } = useContext(AppContext);
  const [tabName, setTabName] = useState("Home");

  useEffect(() => {
    userId === "" ? setTabName("Home") : setTabName("Logout");
  }, [userId]);
  return (
    <div className={styles.container}>
      <nav className={styles.navBar}>
        <Link className={styles.li} to="/">
          {tabName}
        </Link>

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
        {/* <Link className="li" to="duties">
          Duties
        </Link> */}
      </nav>
      <Outlet />
    </div>
  );
}
