import React, { useCallback, useState } from "react"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import AnonymousNavbar from "../../components/AnonymousNavbar"
import usePasswordReset from "../../hooks/usePasswordReset"
import { useTranslation } from "react-i18next"

export default function PasswordReset({ match }) {
  const token = match.params.t
  const [newPassword, setNewPassword] = useState("")
  const [checkPassword, setCheckPassword] = useState("")
  const [outcome, setOutcome] = useState({ type: "unknown" })
  const [{ pending }, { resetPassword }] = usePasswordReset()

  const { t } = useTranslation()

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setOutcome({
        type: "unknown",
      })
      if (checkPassword === newPassword) {
        resetPassword
          .onSuccess(() => {
            setOutcome({
              type: "success",
              message: t("Password changed successfully"),
            })
          })
          .onFailure(() => {
            setOutcome({
              type: "danger",
              message: t(
                "Some error occured, please request again the password recovery. If problem persists, report to your infrastructure manager"
              ),
            })
          })
          .run(token, newPassword)
      }
      return false
    },
    [checkPassword, newPassword, resetPassword, token, t]
  )

  return (
    <>
      <AnonymousNavbar />
      <div
        className="d-flex flex-row justify-content-center align-items-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        <Card style={{ width: 500, maxWidth: "100%" }}>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group>
                <Form.Label>{t("New password")}</Form.Label>
                <Form.Control
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  type="password"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>{t("New password (check)")}</Form.Label>
                <Form.Control
                  value={checkPassword}
                  onChange={(e) => setCheckPassword(e.target.value)}
                  type="password"
                />
              </Form.Group>
              {newPassword !== checkPassword && (
                <p>{t("Passwords don't match")}</p>
              )}
              <div className="text-center mt-3">
                <Button type="submit" variant="primary" disabled={pending}>
                  {t("Confirm")}
                </Button>
              </div>
              {outcome.type !== "unknown" && (
                <Alert className="mt-3" variant={outcome.type}>
                  {outcome.message}
                </Alert>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  )
}
