import React, { useEffect, useState } from "react"
import Modal from "react-bootstrap/Modal"
import Button from "react-bootstrap/Button"
import Form from "react-bootstrap/Form"
import { useTranslation } from "react-i18next"

export default function ChangePasswordModal({
  isOpen,
  onSubmit,
  onCancel,
  onClosed,
  error,
}) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordCheck, setNewPasswordCheck] = useState("")

  const { t } = useTranslation()

  useEffect(() => {
    if (!isOpen) {
      setOldPassword("")
      setNewPassword("")
      setNewPasswordCheck("")
    }
  }, [isOpen])

  return (
    <Modal show={isOpen} onHide={onClosed} size="md">
      <Modal.Header closeButton className="p-3">
        <Modal.Title>{t("Change password")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="old-password">
            <Form.Label className="m-0">{t("Old password")}</Form.Label>
            <Form.Control
              size="sm"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              type="password"
            />
          </Form.Group>
          <Form.Group controlId="new-password">
            <Form.Label className="m-0">{t("New password")}</Form.Label>
            <Form.Control
              size="sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
            />
          </Form.Group>
          <Form.Group controlId="new-password-check">
            <Form.Label className="m-0">
              {t("New password (check)")}
            </Form.Label>
            <Form.Control
              size="sm"
              value={newPasswordCheck}
              onChange={(e) => setNewPasswordCheck(e.target.value)}
              type="password"
            />
            {newPassword !== newPasswordCheck && (
              <Form.Text>{t("Passwords don't match")}</Form.Text>
            )}
          </Form.Group>
        </Form>
        {error && <p className="text-danger">{error}</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={() => onCancel()}>
          {t("Cancel")}
        </Button>
        <Button
          variant="primary"
          size="sm"
          disabled={
            !(
              oldPassword !== "" &&
              newPassword !== "" &&
              newPassword === newPasswordCheck
            )
          }
          onClick={() => {
            if (
              oldPassword !== "" &&
              newPassword !== "" &&
              newPassword === newPasswordCheck
            ) {
              onSubmit(oldPassword, newPassword)
            }
          }}
        >
          {t("Confirm")}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
