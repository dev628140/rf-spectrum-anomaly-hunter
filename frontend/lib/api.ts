import axios from "axios";

const defaultBaseURL = "http://127.0.0.1:8000";
const baseURL = process.env.NEXT_PUBLIC_API_URL || defaultBaseURL;

export const api = axios.create({
  baseURL,
  timeout: 10000,
});