import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./onboarding.module.css";

const SLIDES = [
  {
    title: "Welcome to My Home",
    description: "Organize your shopping and household tasks in one place.",
  },
  {
    title: "How to sign in",
    description:
      "Use your CPF or email to log in. If you don't have an account yet, one will be created automatically.",
  },
  {
    title: "Products",
    description:
      "Browse the catalog, create new products, and add them to your cart.",
  },
  {
    title: "Cart",
    description:
      "Adjust quantities and send your shopping list to the store via WhatsApp.",
  },
  {
    title: "Duties",
    description:
      "Track pending household tasks and mark them as complete.",
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
        Skip
      </button>

      <div className={styles.card}>
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
            ← Back
          </button>
        ) : (
          <span />
        )}
        <button
          className={styles.btnPrimary}
          onClick={isLast ? finish : () => setStep((s) => s + 1)}
        >
          {isLast ? "Get started!" : "Next →"}
        </button>
      </div>
    </div>
  );
}
