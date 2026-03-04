import axios from "axios";

export default axios.create({
  baseURL: "https://daily-production-backend.onrender.com/api",
});
