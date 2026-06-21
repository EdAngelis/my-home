import express from "express";
import morgan from "morgan";
import routes from "./routes/routes";
import cors from "cors";

const app = express();

app.use(cors(
    {
        origin: ['http://localhost:5173', 'https://my-home-front.vercel.app']
    }
));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));
app.use(routes);

app.get("/", (req, res) => {
    res.send("Aew Galerinha que assiste meu Canal");
});

export default app;
