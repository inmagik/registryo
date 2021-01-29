import { rj, useRunRj } from "react-rocketjump"
import api from "../api"

export const UserDetailRj = rj({
  effectCaller: rj.configured(),
  effect: (token) => (userId) => {
    return api.auth(token).get(`/user/${userId}`)
  },
  mutations: {
    update: {
      effect: (token) => (userId, userData) => {
        return api.auth(token).patch(`/user/${userId}`, userData)
      },
      updater: "updateData",
    },
    remove: {
      effect: (token) => (userId) => {
        return api.auth(token).delete(`/user/${userId}`)
      },
      updater: state => state,
    },
    changeMyPassword: {
      effect: (token) => (oldPassword, newPassword) => {
        return api.auth(token).post(`/me/change-password/`, {
          old_password: oldPassword,
          new_password: newPassword,
        })
      },
      updater: (state) => state,
    },
    removeAcl: {
      effect: (token) => (aclEntryId) => {
        return api
          .auth(token)
          .mapResponse(() => aclEntryId)
          .delete(`/aclentry/${aclEntryId}`)
      },
      updater: (state, deletedId) => {
        return {
          ...state,
          data: {
            ...state.data,
            acl: state.data.acl.filter((entry) => entry.id !== deletedId),
          },
        }
      },
    },
    addAcl: {
      effect: (token) => (aclEntryData) => {
        return api.auth(token).post(`/aclentry`, aclEntryData)
      },
      updater: (state, addedAclEntry) => {
        return {
          ...state,
          data: {
            ...state.data,
            acl: [...state.data.acl, addedAclEntry],
          },
        }
      },
    },
  },
})

export default function useUserDetail(userId) {
  return useRunRj(UserDetailRj, [userId])
}
