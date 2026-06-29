import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { homeIcon, plus } from "../../assets/icons/icons";
import styles from "./onboarding.module.css";

const SLIDES = [
  {
    icon: homeIcon,
    title: "Bem-vindo ao My Home",
    description: "Organize suas compras e tarefas domésticas em um só lugar.",
  },
  {
    icon: null,
    title: "Como entrar",
    description:
      "Use seu CPF ou e-mail para fazer login. Se você ainda não tiver uma conta, ela será criada automaticamente.",
  },
  {
    icon: plus,
    title: "Produtos",
    description:
      "Navegue pelo catálogo, crie novos produtos e adicione-os ao seu carrinho.",
  },
  {
    icon: null,
    title: "Carrinho",
    description:
      "Ajuste as quantidades e envie a lista de compras para o mercado pelo WhatsApp.",
  },
  {
    icon: null,
    title: "Tarefas",
    description:
      "Acompanhe as tarefas domésticas pendentes e marque-as como concluídas.",
  },
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const finish = () => {
    localStorage.setItem("myhome_onboarding_done", "true");
    navigate("/");
  };

  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  return (
    <div className={styles.container}>
      <button className={styles.skip} onClick={finish}>
        Pular
      </button>

      <div className={styles.card}>
        {slide.icon && (
          <img className={styles.icon} src={slide.icon} alt="" />
        )}
        <h2 className={styles.title}>{slide.title}</h2>
        <p className={styles.description}>{slide.description}</p>
      </div>

      <div className={styles.dots}>
        {SLIDES.map((_, i) => (
          <span key={i} className={i === step ? styles.dotActive : styles.dot} />
        ))}
      </div>

      <div className={styles.nav}>
        {step > 0 ? (
          <button className={styles.btnSecondary} onClick={() => setStep((s) => s - 1)}>
            ← Anterior
          </button>
        ) : (
          <span />
        )}
        <button
          className={styles.btnPrimary}
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
        >
          {isLast ? "Começar!" : "Próximo →"}
        </button>
      </div>
    </div>
  );
}
