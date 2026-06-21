import styles from "./input-button.module.css";

type Props = {
  type?: string;
  label: string;
  value: string;
  description?: string;
  onClick: () => void;
  onInputChange?: (value: any) => void;
  onKey?: (e: any) => void;
  placeholder?: string;
};

export default function InputButton({
  label,
  onClick,
  type = "text",
  onInputChange,
  onKey,
  placeholder,
  description,
}: Props) {
  const onChange = (event: any) => {
    onInputChange && onInputChange(event.target.value);
  };

  const onKeyDown = (event: any) => {
    if (event.key !== "Enter") return;
    onKey && onKey(event.target.value);
  };

  return (
    <div className={styles.container}>
      <div className={styles.flexContainer}>
        <input
          className={styles.input}
          type={type}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
        <button className={styles.button} onClick={onClick}>
          {label}
        </button>
      </div>
      <span className={styles.description}>{description}</span>
    </div>
  );
}
