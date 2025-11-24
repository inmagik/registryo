import useModalTrigger from "magik-react-hooks/useModalTrigger"
import React, { useState } from "react"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Table from "react-bootstrap/Table"
import { useRj } from "react-rocketjump"
import { Redirect } from "react-router"
import { useAuthUser } from "use-eazy-auth"
import Navbar from "../../components/Navbar"
import { UserDetailRj } from "../../hooks/useUserDetail"
import ChangePasswordModal from "../../components/ChangePasswordModal"
import { useTranslation } from "react-i18next"

const ActionNames = {
  pull: "Sola lettura",
  push: "Sola scrittura",
  "pull,push": "Lettura e scrittura",
}

export default function MyProfile() {
  const { user } = useAuthUser()

  const [, { changeMyPassword }] = useRj(UserDetailRj)

  const [
    { isOpen: showPasswordModal, value: showPasswordModalMounted },
    {
      open: openPasswordModal,
      close: closePasswordModal,
      onClosed: onPasswordModalClosed,
    },
  ] = useModalTrigger()
  const [passwordChangeError, setPasswordChangeError] = useState(null)

  const { t } = useTranslation()

  if (user.is_staff) {
    return <Redirect to={`/users/${user.id}`} />
  }

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        {user && (
          <div>
            <div className="d-flex flex-row justify-content-between align-items-end mb-1">
              <h1 className="m-0">{user.username}</h1>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => openPasswordModal("dummy")}
              >
                {t("Change password")}
              </Button>
            </div>
            <hr className="mb-3 mt-0" />
            <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
              <span className="flex-1 m-0">
                <b className="mr-2">{t("First name")}:</b>
              </span>
              <div className="flex-4">{user.first_name}</div>
            </div>
            <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
              <span className="flex-1 m-0">
                <b className="mr-2">{t("Last name")}:</b>
              </span>
              <div className="flex-4">{user.last_name}</div>
            </div>
            <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
              <span className="flex-1 m-0">
                <b className="mr-2">{t("Email address")}:</b>
              </span>
              <div className="flex-4">{user.email}</div>
            </div>
            <hr className="mb-3 mt-1" />
            <Table striped bordered size="sm">
              <thead>
                <tr>
                  <th>{t("Repository (glob)")}</th>
                  <th>{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {user.acl.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{ActionNames?.[entry.actions] ?? entry.actions}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
        {showPasswordModalMounted && (
          <ChangePasswordModal
            isOpen={showPasswordModal}
            error={passwordChangeError}
            onSubmit={(oldPassword, newPassword) => {
              setPasswordChangeError(null)
              changeMyPassword
                .onSuccess(() => {
                  closePasswordModal(false)
                })
                .onFailure((err) => {
                  console.log({ err })
                  if (err?.response?.old_password) {
                    setPasswordChangeError(t("Bad old password"))
                  } else {
                    setPasswordChangeError(t("Some error occured, please try again"))
                  }
                })
                .run(oldPassword, newPassword)
            }}
            onCancel={() => {
              closePasswordModal(false)
            }}
            onClosed={onPasswordModalClosed}
          />
        )}
      </Container>
    </>
  )
}
