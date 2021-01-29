import React from "react"
import Button from "react-bootstrap/Button"
import Modal from "react-bootstrap/Modal"
import { Trans, useTranslation } from "react-i18next"

export default function ConfirmUserDeleteModal({
  user,
  isOpen,
  onSubmit,
  onCancel,
  onClosed,
}) {
  const { t } = useTranslation()

  const username = user.username

  return (
    <Modal show={isOpen} onHide={onClosed} size="md">
      <Modal.Header closeButton className="p-3">
        <Modal.Title>{t("Delete user")}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          <Trans i18nKey={"deleteUserConfirm"} t={t} username={username}>
            Are you sure to delete user <b>{{username}}</b>? This operation
            is not recoverable.
          </Trans>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={() => onCancel()}>
          {t("Cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={() => onSubmit()}>
          {t("Confirm")}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
