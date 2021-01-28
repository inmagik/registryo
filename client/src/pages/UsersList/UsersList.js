import React from "react"
import Navbar from "../../components/Navbar"
import Container from "react-bootstrap/Container"
import Button from "react-bootstrap/Button"
import useUsersList from "../../hooks/useUsersList"
import ColorfulUserIcon from "../../components/ColorfulUserIcon"
import { useTranslation } from "react-i18next"

export default function UsersList({ history }) {
  const [{ data: users }] = useUsersList()
  const { t } = useTranslation()

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <div className="d-flex flex-row justify-content-between align-items-end mb-3">
          <h1 className="m-0">{t("Users")}</h1>
          <Button
            variant="primary"
            onClick={() => {
              history.push("/users/new")
            }}
            size="sm"
          >
            {t("Create new user")}
          </Button>
        </div>
        {users && (
          <div>
            {users.map((user) => {
              return (
                <div
                  onClick={() => {
                    history.push(`/users/${user.id}`)
                  }}
                  key={user.id}
                  className="bg-white shadow-sm rounded my-3 py-2 px-3 d-flex flex-row align-items-center pointer"
                >
                  <div className="mr-3">
                    <ColorfulUserIcon user={user} />
                  </div>
                  {user.username}
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
