import React, { useState } from "react";
import styles from "./check-box.module.css";

interface CheckBoxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function CheckBox({ label, onChange }: CheckBoxProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;
    setIsChecked(newChecked);
    onChange(newChecked);
  };

  return (
    <div className={styles.container}>
      <label className={styles.container}>
        <input type="checkbox" checked={isChecked} onChange={handleOnChange} />
        <span className={styles.checkmark}></span>
        {label}
      </label>
    </div>
  );
}
