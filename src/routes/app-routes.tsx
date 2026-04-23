import { createBrowserRouter, RouterProvider } from "react-router-dom"

// import ProtectedRoutes from "../context/Auth/protectedRoutes";
import Login from "../pages/Login"
import ProtectedRoutes from "@/context/Auth/protectedRoute"
import MainLayout from "@/layout/mainLayout"
import Create from "@/pages/Create"
import Existing from "@/pages/exsiting"
// import Create from "../pages/Create";
// import Existing from "../pages/Existing";
// import MainLayout from "../layout/mainLayout";
const router = createBrowserRouter([
  {
    path: "/auth/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoutes />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: "/",
            element: <Create />,
          },
          {
            path: "/existing",
            element: <Existing />,
          },
        ],
      },
    ],
  },
])

const AppRoutes = () => {
  return <RouterProvider router={router} />
}

export default AppRoutes
