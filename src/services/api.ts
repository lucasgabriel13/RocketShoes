import axios from "axios";

export const api = axios.create({
  baseURL: process.env.URL_API || "http://localhost:3333",
});
