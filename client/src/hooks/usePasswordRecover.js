import { rj, useRj } from "react-rocketjump"
import api from "../api"

export const PasswordRecoverRj = rj({
  effect: (usernameOrEmail) => {
    return api.post("/me/recover-password/", { user: usernameOrEmail })
  },
})

export default function usePasswordRecover() {
  const [{ pending }, { run }] = useRj(PasswordRecoverRj)
  return [{ pending }, { recoverPassword: run }]
}
