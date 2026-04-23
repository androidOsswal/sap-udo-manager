import axios from "axios";

export const sapApi = axios.create({
  baseURL: "https://apps.jpmgroup.co.in:473/api/b1s/v1",
  withCredentials: true,
})