import { rj, useRunRj } from "react-rocketjump"
import api from "../api"

const TagsRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => (repoName) => {
    return api.auth(token).get(`/registry/${repoName}/tags/list`)
  },
})

export function useRepositoryTags(repoName) {
  return useRunRj(TagsRj, [repoName])
}
