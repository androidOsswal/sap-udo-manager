import axios from "axios"

export async function createDynamicSapClient({
  url,
  username,
  password,
  database,
}: {
  url: string
  username: string
  password: string
  database: string
}) {
  
//   await axios.post(
//     "http://localhost:3000/sap/Logout",
//     {},
//     {
//       withCredentials: true,
//     }
//   )
  await axios.post(
    "http://localhost:3000/setup",
    {
      UserName: username,
      Password: password,
      CompanyDB: database,
      Url: url,
    },
    { withCredentials: true }
  )

  // create new client
  const client = axios.create({
    baseURL: "http://localhost:3000/sap",
    withCredentials: true,
  })

  return client
}
