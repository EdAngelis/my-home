import { useState, useContext, useEffect } from "react";
import { AppContext } from "../../../context";
import {
  createDuty,
  updateDuty,
  deleteDuty,
  getCategories,
  getMakers,
} from "../../../app.service";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./create_duty.module.css";
import IDuties from "../../../models/duties.model";
import ICategory from "../../../models/category.model";
import IMaker from "../../../models/maker.model";
import { Dropdown, Loading } from "../../../components";

// Build a unique `cod` from the name slug + timestamp so the user never types it.
const generateCod = (name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${slug || "duty"}-${Date.now()}`;
};

export default function CreateDuty() {
  const navigate = useNavigate();
  const { userId, defaultHome, homeLoading } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [makers, setMakers] = useState<IMaker[]>([]);
  const [category, setCategory] = useState<string>("");
  const [selectedMakers, setSelectedMakers] = useState<string[]>([]);
  const [paused, setPaused] = useState<boolean>(false);

  const { register, handleSubmit, reset } = useForm();
  const duty: IDuties = useLocation().state;
  const update = duty ? true : false;

  useEffect(() => {
    if (homeLoading) return;
    if (defaultHome === "") {
      navigate("/enter-home");
      return;
    }
    loadOptions();

    reset({
      name: duty?.name,
      frequency: duty?.frequency,
      description: duty?.description,
    });
    setCategory(duty?.category || "");
    setSelectedMakers(duty?.makers || []);
    setPaused(duty?.status === "paused");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultHome, homeLoading]);

  const loadOptions = async () => {
    try {
      const [cats, mkrs] = await Promise.all([
        getCategories(userId),
        getMakers(userId),
      ]);
      setCategories(cats || []);
      setMakers(mkrs || []);
    } catch (error) {
      console.log(error);
    }
  };

  const goTo = (path: string) => {
    navigate(path);
  };

  const hDelete = async () => {
    if (!duty?._id) return;
    if (!window.confirm(`Delete duty "${duty.name}"?`)) return;
    try {
      setLoading(true);
      await deleteDuty(duty._id, defaultHome);
      goTo("/duties");
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const toggleMaker = (id: string) => {
    setSelectedMakers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const hSubmit = async (data: any) => {
    try {
      setLoading(true);
      const status = paused ? "paused" : "active";

      if (update) {
        const next: IDuties = {
          ...duty,
          name: data.name,
          frequency: Number(data.frequency),
          description: data.description,
          category,
          makers: selectedMakers,
          status,
        };
        await updateDuty(next, defaultHome);
      } else {
        const next: IDuties = {
          cod: generateCod(data.name),
          name: data.name,
          frequency: Number(data.frequency),
          value: 1,
          description: data.description,
          history: [],
          createdByUserId: userId,
          home: defaultHome,
          category,
          makers: selectedMakers,
          status,
        };
        await createDuty(next);
      }

      goTo("/duties");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c._id || "",
  }));

  const selectedCategoryName =
    categories.find((c) => c._id === category)?.name || "Category";

  return (
    <>
      {loading ? (
        <div className={styles.container}>
          <Loading />
        </div>
      ) : (
        <form onSubmit={handleSubmit(hSubmit)}>
          <div className={styles.input}>
            <label>Name</label>
            <input {...register("name")} type="text" />
          </div>
          <div className={styles.input}>
            <label>Recurrence (days)</label>
            <input
              {...register("frequency")}
              placeholder="Ex: 7"
              type="number"
            />
          </div>
          <div className={styles.input}>
            <label>Description</label>
            <input {...register("description")} type="text" />
          </div>
          <div className={styles.input}>
            <Dropdown
              title={selectedCategoryName}
              hSelection={(item) => setCategory(item.value)}
              options={categoryOptions}
            />
          </div>
          <div className={styles.input}>
            <label>Makers</label>
            <div className={styles.makers}>
              {makers.map((maker) => (
                <label key={maker._id} className={styles.makerItem}>
                  <input
                    type="checkbox"
                    checked={selectedMakers.includes(maker._id || "")}
                    onChange={() => toggleMaker(maker._id || "")}
                  />
                  {maker.name}
                </label>
              ))}
            </div>
          </div>
          <div className={styles.input}>
            <label className={styles.makerItem}>
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
              />
              Paused
            </label>
          </div>
          <div className={styles.buttons}>
            <button type="button" onClick={() => goTo("/duties")}>
              Cancel
            </button>
            <button type="submit">Save</button>
            {update && (
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={hDelete}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}
    </>
  );
}
