import React, { useCallback, useState } from "react"
import Card from "react-bootstrap/Card"
import Form from "react-bootstrap/Form"
import Alert from "react-bootstrap/Alert"
import Button from "react-bootstrap/Button"
import AnonymousNavbar from "../../components/AnonymousNavbar"
import usePasswordRecover from "../../hooks/usePasswordRecover"
import { useTranslation } from "react-i18next"

export default function PasswordForgot() {
  const [emailOrUsername, setEmailOrUsername] = useState("")
  const [outcome, setOutcome] = useState({ type: "unknown" })
  const [{ pending }, { recoverPassword }] = usePasswordRecover()

  const { t } = useTranslation()

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setOutcome({
        type: "unknown",
      })
      recoverPassword
        .onSuccess(() => {
          setOutcome({
            type: "success",
            message: t("Email sent correctly"),
          })
        })
        .onFailure(() => {
          setOutcome({
            type: "danger",
            message:
              t("Some error occured while sending email, please report this to your infrastructure manager"),
          })
        })
        .run(emailOrUsername)
      return false
    },
    [emailOrUsername, recoverPassword, t]
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
              <p>
                {t("Insert your username or email address to recover associated password")}
              </p>
              <Form.Control
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
              />
              <div className="text-center mt-3">
                <Button type="submit" variant="primary" disabled={pending}>
                  {t("Send email")}
                </Button>
              </div>
              {outcome.type !== "unknown" && (
                <Alert className="mt-3" variant={outcome.type}>{outcome.message}</Alert>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  )
}
