import { rj, useRj } from "react-rocketjump"
import api from "../api"

export const PasswordResetRj = rj({
  effect: (token, newPassword) => {
    return api.post("/me/reset-password/", { token, new_password: newPassword })
  },
})

export default function usePasswordReset() {
  const [{ pending }, { run }] = useRj(PasswordResetRj)
  return [{ pending }, { resetPassword: run }]
}
