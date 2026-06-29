import { useState, useEffect, useCallback, useContext } from "react";
import IDuties from "../../models/duties.model";
import dateDifference from "../../shared/dates-interval";
import { AppContext } from "../../context";
import { getDuties, createDuty, markDutyDone } from "../../app.service";
import styles from "./duties.module.css";

export default function Duties() {
  const [pendents, setPendents] = useState<IDuties[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("");
  const { userId } = useContext(AppContext);

  useEffect(() => {
    loadDuties();
  }, []);

  const loadDuties = async () => {
    const response = await getDuties();
    handlePending(response.data);
  };

  const handlePending = useCallback((data: IDuties[]) => {
    const overdue = data.filter((duty) => {
      const lastExecution = duty.history?.[0]?.date;
      const daysSince = lastExecution
        ? dateDifference(new Date(), new Date(lastExecution))
        : 999;
      return daysSince > duty.frequency;
    });
    setPendents(overdue);
  }, []);

  const handleCreate = async () => {
    if (!name || !frequency || Number(frequency) < 1) return;
    await createDuty({
      name,
      frequency: Number(frequency),
      cod: Date.now().toString(),
      history: [{ date: new Date() }],
      value: 1,
      description: "",
    });
    setName("");
    setFrequency("");
    setShowForm(false);
    await loadDuties();
  };

  const handleMarkDone = async (duty: IDuties) => {
    await markDutyDone(duty._id!, userId || undefined);
    await loadDuties();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tarefas pendentes</h2>
        <button className={styles.btnAdd} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Nova"}
        </button>
      </div>

      {showForm && (
        <div className={styles.form}>
          <input
            className={styles.input}
            placeholder="Nome da tarefa"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={styles.input}
            type="number"
            placeholder="Repetir a cada (dias)"
            value={frequency}
            min={1}
            onChange={(e) => setFrequency(e.target.value)}
          />
          <button className={styles.btnSave} onClick={handleCreate}>
            Salvar
          </button>
        </div>
      )}

      <div className={styles.list}>
        {pendents.length === 0 ? (
          <p className={styles.empty}>Nenhuma tarefa pendente!</p>
        ) : (
          pendents.map((duty, index) => (
            <div className={styles.row} key={index}>
              <div className={styles.dutyInfo}>
                <span className={styles.dutyName}>{duty.name}</span>
                <span className={styles.dutyFreq}>A cada {duty.frequency} dia(s)</span>
              </div>
              <button className={styles.btnDone} onClick={() => handleMarkDone(duty)}>
                ✓
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
