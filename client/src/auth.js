import api from "./api"

export function LoginCall({ username, password }) {
  return api
    .mapResponse((r) => ({ accessToken: r.response.token }))
    .post("/login", { username, password })
}

export function MeCall(token) {
  console.log(token)
  return api
    .auth(token)
    .get("/me")
}
