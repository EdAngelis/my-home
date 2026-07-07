import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import { createHome } from "../../app.service";
import { Loading } from "../../components";
import styles from "./create_home.module.css";

export default function CreateHome() {
  const navigate = useNavigate();
  const { userId, setDefaultHome: setActiveHome } = useContext(AppContext);
  const { register, handleSubmit } = useForm<{ name: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hSubmit = async (data: { name: string }) => {
    if (!data.name?.trim()) {
      setError("Home name is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const home = await createHome(data.name.trim(), userId);
      setActiveHome(home._id);
      navigate("/duties");
    } catch (error) {
      console.log(error);
      setError("Could not create the Home. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <Loading />
      ) : (
        <form onSubmit={handleSubmit(hSubmit)}>
          <div className={styles.input}>
            <label htmlFor="name">Home name</label>
            <input id="name" {...register("name")} type="text" autoFocus />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.buttons}>
            <button type="button" onClick={() => navigate("/enter-home")}>
              Cancel
            </button>
            <button type="submit">Create</button>
          </div>
        </form>
      )}
    </div>
  );
}
