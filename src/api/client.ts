import axios from "axios"

export const sapApi = axios.create({
  // baseURL: "https://apps.jpmgroup.co.in:473/api/b1s/v1",
  baseURL: "http://localhost:3000/sap",
  withCredentials: true,
})

sapApi.interceptors.request.use(
  (config) => {
    // With cookie  no Authorization header is required here.
    

    config.headers = config.headers ?? {}
    return config
  },
  (error) => Promise.reject(error)
)

sapApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401) {
        // Unauthorized because the cookie/session is invalid.
        try {
          const userDetails = JSON.parse(
            localStorage.getItem("user-details") || "{}"
          ) as Record<string, string>
          // if (!userDetails) {
          //   window.location.href = "/auth/login"
          // }
          await axios.post(
            "http://localhost:3000/setup",
            {
              UserName: userDetails?.username,
              Password: userDetails?.password,
              CompanyDB: userDetails?.database,
              Url: userDetails?.url,
            },
            {
              withCredentials: true,
            }
          )
        } catch  {
          localStorage.removeItem("user-details")
          window.location.href = "/auth/login"
       
        }
      }
    }
    return Promise.reject(error)
  }
)
