import { BrowserRouter } from "react-router-dom";
import { AppProvider } from "./context";
import styles from "./app.module.css";
import Routes from "./routes";

function App() {
  return (
    <div className={styles.container}>
      <AppProvider>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </AppProvider>
    </div>
  );
}

export default App;
