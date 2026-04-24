import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import {
  AlertCircle,
  ArrowRight,
  Database,
  LockKeyhole,
  Server,
  UserRound,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { backgroundSapLogin } from "@/api/saplogin"

// type LoginResponse = {
//   SessionId?: string //token
// }

const normalizeBaseUrl = (url: string) => {
  return url.replace(/\/+$/, "")
}

// const saveCookie = (name: string, value: string) => {
//   document.cookie = `${name}=${encodeURIComponent(
//     value
//   )}; path=/; max-age=86400; SameSite=Lax`
// }
// const saveCookie = (name: string, value: string, maxAge = 3600) => {
//   const secure = window.location.protocol === "https:" ? "Secure;" : ""
//   document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; ${secure}`
// }

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  url: z.string().trim().url("Enter a valid URL"),
  database: z.string().trim().min(1, "Database is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

const getSavedLoginDetails = () => {
  const fallback = {
    username: "",
    password: "",
    url: "",
    database: "",
  }

  try {
    const savedDetails = localStorage.getItem("user-details")
    if (!savedDetails) return fallback

    const parsedDetails = JSON.parse(savedDetails) as Partial<LoginFormValues>

    return {
      ...fallback,
      username: parsedDetails.username ?? "",
      url: parsedDetails.url ?? "",
      database: parsedDetails.database ?? "",
    }
  } catch {
    return fallback
  }
}
const getLoginErrorMessage = (error: unknown) => {
  if (!error) return null
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as
      | { error?: { message?: { value?: string } } }
      | undefined
    return responseData?.error?.message?.value ?? error.message
  }
  return error instanceof Error ? error.message : "Unable to log in."
}

const Login = () => {
  const navigate = useNavigate()

  // const loginMutation = useMutation({
  //   mutationFn: async (values: LoginFormValues) => {
  //     const baseUrl = normalizeBaseUrl(values.url)

  //     const response = await axios.post<LoginResponse>(
  //       `${baseUrl}/b1s/v1/Login`,
  //       {
  //         CompanyDB: values.database,
  //         UserName: values.username,
  //         Password: values.password,
  //       },
  //       {
  //         withCredentials: true,
  //       }
  //     )
  //     await backgroundSapLogin()

  //     return response.data
  //   },
  //   onSuccess: (data, values) => {
  //     const token = data.SessionId

  //     if (token) {
  //       saveCookie("B1SESSION", token)
  //     }
  //     localStorage.setItem(
  //       "user-details",
  //       JSON.stringify({
  //         url: normalizeBaseUrl(values.url),
  //         database: values.database,
  //         username: values.username,
  //       })
  //     )

  //     navigate("/")
  //   },
  // })
  const loginMutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const baseUrl = normalizeBaseUrl(values.url)

      const response = await axios.post(
        "http://localhost:3000/setup",
        {
          UserName: values.username,
          Password: values.password,
          CompanyDB: values.database,
          Url: baseUrl,
        },
        {
          withCredentials: true,
        }
      )

      console.log("SETUP DONE:", response.data)

      return response.data
    },
    onSuccess: (_, values) => {
      console.log("come here")
      // const token = data.SessionId
      // if (token) {
      //   saveCookie("B1SESSION", token)
      // }
      localStorage.setItem(
        "user-details",
        JSON.stringify({
          url: normalizeBaseUrl(values.url),
          database: values.database,
          username: values.username,
        })
      )

      navigate("/")
    },
    onError: (err) => {
      console.error(" MUTATION ERROR:", err)
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: getSavedLoginDetails(),
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }
  const apiError = getLoginErrorMessage(loginMutation.error)
  const isLoggingIn = loginMutation.isPending

  return (
    <section className="max-w-8xl mx-auto flex min-h-screen w-full items-center justify-center gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div
        className="absolute min-h-dvh w-dvw bg-cover bg-center"
        style={{
          backgroundImage: 'url("/assets/bg-image.jpg")',
        }}
      ></div>
      <div className="relative z-9999 h-160 w-120 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-7">
          <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <LockKeyhole className="size-5" />
          </div>
          <h2 className="text-3xl font-semibold tracking-normal text-zinc-950">
            Welcome back
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Enter your credentials to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="username"
                type="text"
                placeholder="manager"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                className="h-11 border-zinc-300 bg-white pl-10"
                {...register("username")}
              />
            </div>
            {errors.username ? (
              <p className="text-sm text-red-600">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <Server className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="url"
                type="url"
                placeholder="https://example.com:50001"
                autoComplete="url"
                aria-invalid={Boolean(errors.url)}
                className="h-11 border-zinc-300 bg-white pl-10"
                {...register("url")}
              />
            </div>
            {errors.url ? (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <div className="relative">
              <Database className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="database"
                type="text"
                placeholder="database"
                autoComplete="off"
                aria-invalid={Boolean(errors.database)}
                className="h-11 border-zinc-300 bg-white pl-10"
                {...register("database")}
              />
            </div>
            {errors.database ? (
              <p className="text-sm text-red-600">{errors.database.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="h-11 border-zinc-300 bg-white pl-10"
                {...register("password")}
              />
            </div>
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            className="h-11 w-full bg-teal-700 text-white hover:bg-teal-800"
            type="submit"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? "Loging in..." : "Log in"}
            {!isLoggingIn ? <ArrowRight className="size-4" /> : null}
          </Button>
          {apiError ? (
            <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{apiError}</p>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  )
}

export default Login
