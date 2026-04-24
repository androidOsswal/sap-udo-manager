import axios from "axios"

export const sapApi = axios.create({
  // baseURL: "https://apps.jpmgroup.co.in:473/api/b1s/v1",
  baseURL: "http://localhost:3000/sap",
  withCredentials: true,
})
