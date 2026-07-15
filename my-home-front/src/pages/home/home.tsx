import { useState, useContext, useEffect } from "react";
import { cpfValidator, EmailValidator } from "../../components/validators";
import { getBuyerByCpf, createBuyer } from "../../app.service";
import { AppContext } from "../../context";
import { Loading } from "../../components";
import InputButton from "../../components/input-button/input-button";
import styles from "./home.module.css";
import { useNavigate } from "react-router-dom";
import IBuyer from "../../models/buyer.model";

export default function Home() {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { userId, setUserId, defaultHome, setDefaultHome, homeLoading } =
    useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      if (homeLoading) return;
      navigate(defaultHome ? "/duties" : "/enter-home");
    } else if (!localStorage.getItem("myhome_onboarding_done")) {
      navigate("/welcome");
    }
  }, [userId, defaultHome, homeLoading]);

  const goToHomeStep = (buyer?: IBuyer) => {
    const home = buyer?.defaultHome || "";
    setDefaultHome(home);
    navigate(home ? "/duties" : "/enter-home");
  };

  const hLogin = async (cpfValue: string = cpf) => {
    if (cpfValidator(cpfValue) || EmailValidator(cpfValue)) {
      setLoading(true);
      try {
        const resp = await getBuyerByCpf(cpfValue);
        const { message } = resp;

        if (message === "Buyer not found") {
          const newBuyer: IBuyer = { cpf: cpfValue };
          const resp = await createBuyer(newBuyer);
          if (resp.status === 200) {
            const buyer: IBuyer = resp.data.data;
            const id = buyer._id!;
            setUserId(id);
            localStorage.setItem("buyerId", id);
            goToHomeStep(buyer);
          } else {
            console.log("Show Alerta");
          }
        } else {
          const buyer: IBuyer = resp.data;
          const id = buyer._id!;
          setUserId(id);
          localStorage.setItem("buyerId", id);
          goToHomeStep(buyer);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    } else {
      setError(true);
    }
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.subContainer}>
          {loading ? (
            <Loading />
          ) : (
            <div className={styles.loginInput}>
              <InputButton
                label="Login"
                value={cpf}
                onInputChange={(v) => { setCpf(v); setError(false); }}
                onKey={(v) => hLogin(v)}
                onClick={() => hLogin()}
                placeholder="Enter your email or CPF"
                type="text"
              />
              <div className={styles.error}>
                {error && <p>Invalid email or CPF</p>}
              </div>
            </div>
          )}
        </div>
        <p>This app lets you send shopping lists via WhatsApp</p>
      </div>
    </>
  );
}
