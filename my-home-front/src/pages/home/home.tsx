import { useState, useContext, useEffect } from "react";
import { createBuyer } from "../../app.service";
import { AppContext } from "../../context";
import { Loading } from "../../components";
import styles from "./home.module.css";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const { userId, setUserId } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) navigate("/products");
    else if (!localStorage.getItem("myhome_onboarding_done")) navigate("/welcome");
  }, []);

  const handleEnter = async () => {
    setLoading(true);
    try {
      const anonCpf = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const resp = await createBuyer({ cpf: anonCpf });
      if (resp.status === 200) {
        const id = resp.data.data._id;
        setUserId(id);
        localStorage.setItem("buyerId", id);
      }
      navigate("/products");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.subContainer}>
          {loading ? (
            <Loading />
          ) : (
            <button className={styles.btnEnter} onClick={handleEnter}>
              Entrar
            </button>
          )}
        </div>
        <p>O intuito deste App é o envio de listas de compras pelo WhatsApp</p>
      </div>
    </>
  );
}
