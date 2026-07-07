import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../../app.service";
import ICategory from "../../models/category.model";
import TrashIcon from "../../components/svg/trash-icon";
import styles from "./categories.module.css";

export default function Categories() {
  const navigate = useNavigate();
  const { userId, defaultHome, homeLoading } = useContext(AppContext);
  const [categories, setCategories] = useState<ICategory[]>([]);
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
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, defaultHome, homeLoading]);

  const loadCategories = async () => {
    try {
      const response = await getCategories(defaultHome);
      setCategories(response || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await createCategory({
        name: name.trim(),
        createdByUserId: userId,
        home: defaultHome,
      });
      setName("");
      loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deleteCategory(id, defaultHome);
      loadCategories();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Categories</h1>
      <div className={styles.add}>
        <input
          placeholder="New category"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd}>ADD</button>
      </div>
      <div className={styles.list}>
        {categories.map((category) => (
          <div className={styles.row} key={category._id}>
            <span>{category.name}</span>
            <div onClick={() => handleDelete(category._id)}>
              <TrashIcon color1="#00641C" color2="#D1FFCD" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
