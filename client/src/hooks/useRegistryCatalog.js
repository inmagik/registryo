import { rj, useRunRj } from "react-rocketjump"
import api from "../api"

const CatalogRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => () => {
    return api
      .auth(token)
      .get("/registry/catalog")
  },
})

export function useRegistryCatalog() {
  return useRunRj(CatalogRj, [])
}
