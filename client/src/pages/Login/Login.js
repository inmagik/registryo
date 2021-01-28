import React, { useEffect, useState } from "react"
import { useAuthActions, useAuthState } from "use-eazy-auth"
import AnonymousNavbar from "../../components/AnonymousNavbar"
import Form from "react-bootstrap/Form"
import Card from "react-bootstrap/Card"
import Button from "react-bootstrap/Button"
import Alert from "react-bootstrap/Alert"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const { loginLoading, loginError } = useAuthState()
  const { login, clearLoginError } = useAuthActions()

  // clear login error on unmount
  useEffect(() => () => clearLoginError(), [clearLoginError])

  // clear login error when username or password changes
  useEffect(() => {
    clearLoginError()
  }, [username, password, clearLoginError])

  const { t } = useTranslation()

  return (
    <>
      <AnonymousNavbar />
      <div
        className="d-flex flex-row justify-content-center align-items-center"
        style={{ width: "100vw", height: "100vh" }}
      >
        <Card style={{ width: 500, maxWidth: "100%" }}>
          <Card.Body>
            <Form
              onSubmit={(e) => {
                e.preventDefault()
                if (username !== "" && password !== "") {
                  login({ username, password })
                }
              }}
            >
              <Form.Group>
                <Form.Label className="mb-0">{t("Username")}</Form.Label>
                <Form.Control
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  type="text"
                />
              </Form.Group>
              <Form.Group>
                <Form.Label className="mb-0">{t("Password")}</Form.Label>
                <Form.Control
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />
              </Form.Group>
              <div className="text-center mt-3">
                <Button type="submit" variant="primary" disabled={loginLoading}>
                  {t("Confirm")}
                </Button>
              </div>
              <p className="text-center small mt-3">
                {t("Forgot password?")}{" "}
                <Link to="/forgot-password">{t("Password recovery")}</Link>
              </p>
              {loginError && (
                <Alert className="mt-3" variant={"danger"}>
                  {t("Bad username / password")}
                </Alert>
              )}
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  )
}
