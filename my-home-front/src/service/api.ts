import axios from "axios";

// Shared Axios instance used by every function in app.service.ts.
// baseURL is read from VITE_API_URL (.env), which must point to the my-home-api server.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

export default api;
