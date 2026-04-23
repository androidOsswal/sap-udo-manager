export const getCookie = (name: string) => {
  const cookies = document.cookie.split("; ")
  const cookie = cookies.find((item) => item.startsWith(`${name}=`))
  if (!cookie) return null
  return decodeURIComponent(cookie.split("=")[1])
}
