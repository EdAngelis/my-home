import { useEffect } from "react";
import styles from "./alert.module.css";

interface IAlert {
  alertOn: boolean;
  setAlertOn: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Alert({ alertOn, setAlertOn }: IAlert) {
  useEffect(() => {
    if (alertOn) {
      setTimeout(() => {
        alertOn && setAlertOn(false);
      }, 500);
    }
  }, [alertOn]);

  return (
    <div
      className={`${styles.alert} ${alertOn ? styles.triggerAlert : ""}`}
    ></div>
  );
}
