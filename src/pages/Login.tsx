import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import axios, { AxiosError } from "axios"
import {
  AlertCircle,
  Database,
  LockKeyhole,
  Server,
  UserRound,
  Eye,
  EyeOff,
  LogIn,
} from "lucide-react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import React from "react"

const normalizeBaseUrl = (url: string) => {
  return url.replace(/\/+$/, "")
}

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
    if (error.response?.status === 401) {
      return "Invalid username or password."
    }
    const responseData = error.response?.data as
      | { error?: { message?: { value?: string } } }
      | undefined
    // return (
    //   responseData?.error?.message?.value ??
    //   "Login failed:"
    // )
    return responseData?.error?.message?.value ?? error.message
  }
  return error instanceof Error ? error.message : "Unable to log in."
}

const Login = () => {
  const navigate = useNavigate()
  const [isShowPassword, setIsShowPassword] = React.useState(false)
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
     

      return response.data
    },
    onSuccess: (_, values) => {
      localStorage.setItem(
        "user-details",
        JSON.stringify({
          url: normalizeBaseUrl(values.url),
          database: values.database,
          username: values.username,
          password: values.password,
        })
      )

      navigate("/")
    },
    onError: (err) => {
      console.error("❌ Login failed:", err)
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
        className="absolute min-h-dvh w-dvw bg-cover bg-center opacity-40"
        style={{
          backgroundImage: 'url("/assets/bg-image.jpg")',
        }}
      ></div>
      <div className="relative z-9999 w-120 rounded-tl-3xl rounded-tr-md rounded-br-4xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7">
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
          <div className="relative space-y-2">
            <Label htmlFor="username" className="">
              Username
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                className="h-11 border border-zinc-300 bg-white pl-10"
                {...register("username")}
              />
            </div>
            {errors.username ? (
              <p className="text-sm text-red-600">{errors.username.message}</p>
            ) : null}
          </div>
          {/* <div className="relative space-y-2">
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />

              <Input
                id="username"
                type="text"
                placeholder=" "
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                className="peer h-11 border-zinc-300 bg-white pl-10"
                {...register("username")}
              />

              <Label
                htmlFor="username"
                className="absolute top-1/2 left-10 -translate-y-1/2 text-zinc-500 transition-all duration-200 peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-zinc-700 peer-focus:top-2 peer-focus:text-xs peer-focus:text-zinc-700"
              >
                Username
              </Label>
            </div>

            {errors.username && (
              <p className="text-sm text-red-600">{errors.username.message}</p>
            )}
          </div> */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <div className="relative">
              <Server className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="url"
                type="url"
                placeholder="Enter your SAP server URL"
                autoComplete="url"
                aria-invalid={Boolean(errors.url)}
                className="h-11 border border-zinc-300 bg-white pl-10 font-sans tracking-wide"
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
              <Database className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 font-bold text-zinc-500" />
              <Input
                id="database"
                type="text"
                placeholder="Enter database name"
                autoComplete="off"
                aria-invalid={Boolean(errors.database)}
                className="h-11 border border-zinc-300 bg-white pl-10"
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
                type={isShowPassword ? "text" : "password"}
                placeholder="Enter password "
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                className="h-11 border border-zinc-300 bg-white pl-10 font-sans font-bold tracking-wide"
                {...register("password")}
              />
              {isShowPassword ? (
                <EyeOff
                  onClick={() => setIsShowPassword(false)}
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer text-zinc-500"
                />
              ) : (
                <Eye
                  onClick={() => setIsShowPassword(true)}
                  className="absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer text-zinc-500"
                />
              )}
            </div>
            {errors.password ? (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          <Button
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 bg-teal-700 text-white hover:bg-teal-800"
            type="submit"
            disabled={isLoggingIn}
          >
            <span> {isLoggingIn ? "Loging in..." : "Log in"}</span>
            <span>
              {!isLoggingIn ? <LogIn className="size-5 text-end" /> : null}
            </span>
          </Button>
          {apiError ? (
            <div className="flex gap-3 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
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
