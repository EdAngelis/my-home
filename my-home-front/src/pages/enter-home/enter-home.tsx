import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context";
import {
  listHomes,
  joinHome,
  setDefaultHome,
  removeHomeFromUser,
} from "../../app.service";
import { homeCodeValidator } from "../../components/validators";
import InputButton from "../../components/input-button/input-button";
import { Loading } from "../../components";
import TrashIcon from "../../components/svg/trash-icon";
import IHome from "../../models/home.model";
import styles from "./enter-home.module.css";

export default function EnterHome() {
  const navigate = useNavigate();
  const { userId, setDefaultHome: setActiveHome } = useContext(AppContext);

  const [homes, setHomes] = useState<IHome[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [selecting, setSelecting] = useState<string>("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (userId === "") {
      navigate("/");
      return;
    }
    loadHomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadHomes = async () => {
    try {
      setLoading(true);
      const data = await listHomes(userId);
      setHomes(data || []);
    } catch (error) {
      console.log(error);
      setError("Could not load your homes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const hJoin = async (value: string = code) => {
    if (!homeCodeValidator(value)) {
      setError("Enter a valid 4-digit code");
      return;
    }
    setError("");
    setJoining(true);
    try {
      const home = await joinHome(value, userId);
      setActiveHome(home._id);
      navigate("/duties");
    } catch (error) {
      console.log(error);
      setError("No home found with that code");
    } finally {
      setJoining(false);
    }
  };

  const hSelect = async (home: IHome) => {
    if (!home._id) return;
    setError("");
    setSelecting(home._id);
    try {
      await setDefaultHome(userId, home._id);
      setActiveHome(home._id);
      navigate("/duties");
    } catch (error) {
      console.log(error);
      setError("Could not set this as your active home");
    } finally {
      setSelecting("");
    }
  };

  const hRemove = async (home: IHome) => {
    if (!home._id) return;
    if (!window.confirm(`Remove home "${home.name}"?`)) return;
    try {
      await removeHomeFromUser(home._id, userId);
      loadHomes();
    } catch (error) {
      console.log(error);
      setError("Could not remove this home");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Enter a Home</h1>

      <InputButton
        label={joining ? "Joining..." : "Enter Home"}
        value={code}
        onInputChange={(v) => {
          setCode(v);
          setError("");
        }}
        onKey={(v) => hJoin(v)}
        onClick={() => hJoin()}
        placeholder="4-digit code"
        type="text"
      />

      <button
        className={styles.createButton}
        onClick={() => navigate("/create-home")}
      >
        Create a new Home
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <Loading />
      ) : homes.length === 0 ? (
        <p className={styles.empty}>You don't belong to any Home yet.</p>
      ) : (
        <div className={styles.list}>
          {homes.map((home) => (
            <div key={home._id} className={styles.card}>
              <button
                className={styles.cardButton}
                onClick={() => hSelect(home)}
                disabled={selecting === home._id}
              >
                <span className={styles.cardName}>{home.name}</span>
                <span className={styles.cardCode}>#{home.code}</span>
              </button>
              <button
                className={styles.remove}
                onClick={() => hRemove(home)}
                aria-label={`Remove home ${home.name}`}
              >
                <TrashIcon color1="#00641C" color2="#D1FFCD" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
