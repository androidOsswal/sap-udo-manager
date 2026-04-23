import { sapApi } from "./client"

export async function backgroundSapLogin() {
  const response = await sapApi.post("/SapLogin", {
    U_SlpCode: 1,
    U_UserName: "manager2",
    DeviceId: "web-client",
    DeviceType: "Web",
    Version: "0.36.0",
    IpAddress: "",
    Database: "JPM_MINDA_I2",
    TimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    RequestTimeUtc: new Date(),
  })
  
  

  return response.data
}
