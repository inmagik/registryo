import { rj, useRunRj } from "react-rocketjump"
import api from "../api"

const ManifestRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => (repoName, refName) => {
    return api.auth(token).get(`/registry/${repoName}/manifests/${refName}/`)
  },
})

export default function useManifest(repoName, refName) {
  return useRunRj(ManifestRj, [repoName, refName])
}
