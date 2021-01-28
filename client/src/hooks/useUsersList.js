import { rj, useRunRj } from "react-rocketjump"
import api from "../api"

const UsersListRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => () => {
    return api.auth(token).get(`/user`)
  },
})

export default function useUsersList() {
  return useRunRj(UsersListRj)
}
