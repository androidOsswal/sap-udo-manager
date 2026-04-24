// import { getCookie } from "@/storage/cookies"
// import { Navigate, Outlet, useLocation } from "react-router-dom"

// const ProtectedRoute = () => {
//   const location = useLocation()

//   const token = getCookie("B1SESSION")
//   if (!token && location.pathname !== "/auth/login") {
//     return <Navigate to="/auth/login" replace />
//   }
//   if (token && location.pathname == "/auth/login") {
//     return <Navigate to="/" replace />
//   }
//   return <Outlet />
// }

// export default ProtectedRoute

import { Navigate, Outlet, useLocation } from "react-router-dom"

const ProtectedRoute = () => {
  // const location = useLocation()

  // const token = getCookie("B1SESSION")
  // if (!token && location.pathname !== "/auth/login") {
  //   return <Navigate to="/auth/login" replace />
  // }
  // if (token && location.pathname == "/auth/login") {
  //   return <Navigate to="/" replace />
  // }
  // return <Outlet />

  const location = useLocation()

  const user = localStorage.getItem("user-details")

  if (!user && location.pathname !== "/auth/login") {
    return <Navigate to="/auth/login" replace />
  }

  if (user && location.pathname === "/auth/login") {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default ProtectedRoute
// import { Navigate, Outlet, useLocation } from "react-router-dom"

// const ProtectedRoute = () => {
//   const location = useLocation()

//   const user = localStorage.getItem("user-details")

//   if (!user && location.pathname !== "/auth/login") {
//     return <Navigate to="/auth/login" replace />
//   }

//   if (user && location.pathname === "/auth/login") {
//     return <Navigate to="/" replace />
//   }

//   return <Outlet />
// }

// export default ProtectedRoute
