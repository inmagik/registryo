import React, { useState } from "react"
import Container from "react-bootstrap/Container"
import { useAuthUser } from "use-eazy-auth"
import Jdenticon from "../../components/Jdenticon"
import Navbar from "../../components/Navbar"
import { useRegistryCatalog } from "../../hooks/useRegistryCatalog"
import Form from "react-bootstrap/Form"
import { useTranslation } from "react-i18next"

export default function Home({ history }) {
  const { user } = useAuthUser()
  const [{ data: catalog }] = useRegistryCatalog(user.registry)
  const [searchStr, setSearchStr] = useState("")
  const { t } = useTranslation()

  const showRepos = searchStr
    ? catalog?.repositories.filter((repo) =>
        repo.toLowerCase().includes(searchStr.toLowerCase())
      )
    : catalog?.repositories

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <div className="d-flex flex-row justify-content-between align-items-end mb-3">
          <h1 className="m-0">{t("Repository")}</h1>
          <Form inline>
            <Form.Control
              value={searchStr}
              onChange={(e) => setSearchStr(e.target.value)}
              placeholder={t("Search")}
            />
          </Form>
        </div>
        {catalog && (
          <div>
            {showRepos.map((repoName) => {
              return (
                <div
                  onClick={() => {
                    history.push(`/repositories/${repoName}`)
                  }}
                  key={repoName}
                  className="bg-white shadow-sm rounded my-3 py-2 px-3 d-flex flex-row align-items-center pointer"
                >
                  <div className="mr-3">
                    <Jdenticon size="32" value={repoName} />
                  </div>
                  {repoName}
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
