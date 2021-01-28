import { rj, useRj } from "react-rocketjump"
import api from "../api"

const UserCreateRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => (userData) => {
    return api.auth(token).post(`/user`, userData)
  },
})

export default function useNewUser() {
  return useRj(UserCreateRj)
}
