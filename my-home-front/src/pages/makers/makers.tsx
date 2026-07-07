import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import { getMakers, createMaker, deleteMaker } from "../../app.service";
import IMaker from "../../models/maker.model";
import TrashIcon from "../../components/svg/trash-icon";
import styles from "./makers.module.css";

export default function Makers() {
  const navigate = useNavigate();
  const { userId, defaultHome, homeLoading } = useContext(AppContext);
  const [makers, setMakers] = useState<IMaker[]>([]);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (userId === "") {
      navigate("/");
      return;
    }
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
      return;
    }
    loadMakers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, defaultHome, homeLoading]);

  const loadMakers = async () => {
    try {
      const response = await getMakers(userId, defaultHome);
      setMakers(response || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await createMaker({
        name: name.trim(),
        createdByUserId: userId,
        home: defaultHome,
      });
      setName("");
      loadMakers();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteMaker(id, userId, defaultHome);
      loadMakers();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Makers</h1>
      <div className={styles.add}>
        <input
          placeholder="New maker"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd}>ADD</button>
      </div>
      <div className={styles.list}>
        {makers.map((maker) => (
          <div className={styles.row} key={maker._id}>
            <span>{maker.name}</span>
            <div onClick={() => handleDelete(maker._id)}>
              <TrashIcon color1="#00641C" color2="#D1FFCD" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
