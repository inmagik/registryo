import magikApi from "magik-api"

export const API_URL = "/v1"

export default magikApi()
  .baseUrl(API_URL)
  .trailingSlash(true)
  .authHeaders((token) => {
    return {
      Authorization: `Token ${token}`,
    }
  })
