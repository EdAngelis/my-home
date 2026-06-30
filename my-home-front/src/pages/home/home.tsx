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

  const { userId, setUserId } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) navigate("/products");
    else if (!localStorage.getItem("myhome_onboarding_done")) navigate("/welcome");
  }, []);

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
            const id = resp.data.data._id;
            setUserId(id);
            localStorage.setItem("buyerId", id);
          } else {
            console.log("Show Alerta");
          }
        } else {
          const id = resp.data._id;
          setUserId(id);
          localStorage.setItem("buyerId", id);
        }
        navigate("/products");
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
                label="Entrar"
                value={cpf}
                placeholder="Use seu EMAIL ou CPF"
                onInputChange={(v) => { setCpf(v); setError(false); }}
                onKey={(v) => hLogin(v)}
                onClick={() => hLogin()}
              />
              <div className={styles.error}>
                {error && <p>E-mail ou CPF inválidos</p>}
              </div>
              <span>Caso não existam uma nova conta será criada</span>
            </div>
          )}
        </div>
        <p>O intuito deste App é o envio de listas de compras pelo WhatsApp</p>
      </div>
    </>
  );
}
