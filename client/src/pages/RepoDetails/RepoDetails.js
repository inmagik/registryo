import React from "react"
import Container from "react-bootstrap/Container"
import { Trans } from "react-i18next"
import { useTranslation } from "react-i18next"
import ColorfulUserIcon from "../../components/ColorfulUserIcon"
import Jdenticon from "../../components/Jdenticon"
import Navbar from "../../components/Navbar"
import { useRepositoryTags } from "../../hooks/useRepositoryTags"

export default function RepoDetails({ history, match }) {
  const repoName = match.params.repoName
  const [{ data: tags }] = useRepositoryTags(repoName)

  const { t } = useTranslation()

  const ActionNames = {
    pull: t("Read only"),
    push: t("Write only"),
    "pull,push": t("Read and write"),
  }

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <h1 className="mb-4">{repoName}</h1>
        {tags && (
          <div>
            <h3>{t("Tags")}</h3>
            {tags.tags.map((tag) => {
              return (
                <div
                  onClick={() => {
                    history.push(`/repositories/${repoName}/tag/${tag}`)
                  }}
                  key={tag}
                  className="bg-white shadow-sm rounded my-3 py-2 px-3 d-flex flex-row align-items-center pointer"
                >
                  <div className="mr-3">
                    <Jdenticon size="32" value={`${repoName}:${tag}`} />
                  </div>
                  {tag}
                </div>
              )
            })}
            <h3>{t("Users")}</h3>
            <p>
              <Trans t={t} i18nKey="users-have-rights-on-repo">
                The following users can perform actions on this repository
              </Trans>
            </p>
            {tags.acl.map((user) => {
              return (
                <div
                  key={user.username}
                  className="bg-white shadow-sm rounded my-3 py-2 px-3 d-flex flex-row align-items-center justify-content-between"
                >
                  <div className="d-flex flex-row align-items-center justify-content-start">
                    <div className="mr-3">
                      <ColorfulUserIcon user={user} />
                    </div>
                    {user.first_name &&
                      user.last_name &&
                      [user.first_name, user.last_name].join(" ")}
                    {!(user.first_name && user.last_name) && user.username}
                  </div>
                  <span className="badge badge-secondary font-weight-normal">
                    {ActionNames[user.actions]}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
