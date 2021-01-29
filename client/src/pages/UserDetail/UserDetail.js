import React, { useState } from "react"
import Container from "react-bootstrap/Container"
import Table from "react-bootstrap/Table"
import Form from "react-bootstrap/Form"
import Button from "react-bootstrap/Button"
import Navbar from "../../components/Navbar"
import useUserDetail from "../../hooks/useUserDetail"
import { useAuthUser } from "use-eazy-auth"
import { Field, Formik } from "formik"
import ChangePasswordModal from "../../components/ChangePasswordModal"
import useModalTrigger from "magik-react-hooks/useModalTrigger"
import { useTranslation } from "react-i18next"
import ConfirmUserDeleteModal from "../../components/ConfirmUserDeleteModal"
import { Trans } from "react-i18next"

const DEFAULT_ACL = { type: "repository", name: "*", actions: "pull" }

function InputField({ field, form, ...props }) {
  return <Form.Control {...props} {...field} />
}

function CheckField({ field, form, ...props }) {
  const { value, ...other } = field
  return <Form.Check {...props} checked={value} {...other} />
}

export default function UserDetail({ match, history }) {
  const userId = match.params.id
  const { user: me } = useAuthUser()

  const [
    { data: user },
    { update, remove, addAcl, removeAcl, changeMyPassword },
  ] = useUserDetail(userId)

  const [addingAcl, setAddingAcl] = useState(DEFAULT_ACL)

  const [
    { isOpen: showPasswordModal, value: showPasswordModalMounted },
    {
      open: openPasswordModal,
      close: closePasswordModal,
      onClosed: onPasswordModalClosed,
    },
  ] = useModalTrigger()
  const [
    { isOpen: showDeleteModal, value: deleteModalMounted },
    {
      open: openDeleteModal,
      close: closeDeleteModal,
      onClosed: onDeleteModalClosed,
    },
  ] = useModalTrigger()
  const [passwordChangeError, setPasswordChangeError] = useState(null)

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
        {user && (
          <div>
            <div className="d-flex flex-row justify-content-between align-items-end mb-1">
              <h1 className="m-0">{user.username}</h1>
              {me.id === user.id && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openPasswordModal("dummy")}
                >
                  {t("Change password")}
                </Button>
              )}
              {me.id !== user.id && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => openDeleteModal("dummy")}
                >
                  {t("Delete user")}
                </Button>
              )}
            </div>
            <hr className="mb-3 mt-0" />
            <Formik
              initialValues={user}
              onSubmit={(values) => {
                const { first_name, last_name, email, is_staff } = values
                return update.asPromise(user.id, {
                  first_name,
                  last_name,
                  email,
                  is_staff,
                })
              }}
            >
              {(formik) => (
                <Form onSubmit={formik.handleSubmit}>
                  <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                    <label htmlFor="first-name-input" className="flex-1 m-0">
                      <b className="mr-2">{t("First name")}:</b>
                    </label>
                    <div className="flex-4">
                      <Field
                        name="first_name"
                        id="first-name-input"
                        component={InputField}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                    <label htmlFor="last-name-input" className="flex-1 m-0">
                      <b className="mr-2">{t("Last name")}:</b>
                    </label>
                    <div className="flex-4">
                      <Field
                        name="last_name"
                        id="last-name-input"
                        component={InputField}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                    <label htmlFor="email-input" className="flex-1 m-0">
                      <b className="mr-2">{t("Email address")}:</b>
                    </label>
                    <div className="flex-4">
                      <Field
                        name="email"
                        component={InputField}
                        size="sm"
                        type="email"
                        id="email-input"
                      />
                    </div>
                  </div>
                  <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                    <label htmlFor="is-staff-input" className="flex-1 m-0">
                      <b className="mr-2">{t("Admin role")}*:</b>
                    </label>
                    <div className="flex-4">
                      <Field
                        name="is_staff"
                        id="is-staff-input"
                        component={CheckField}
                        disabled={me.id === user.id}
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      variant="secondary"
                      className="mr-3"
                      type="button"
                      size="sm"
                      onClick={() => formik.resetForm()}
                    >
                      {t("Cancel edits")}
                    </Button>
                    <Button variant="success" type="submit" size="sm">
                      {t("Save")}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
            <hr className="mb-3 mt-1" />
            <Table striped bordered size="sm">
              <thead>
                <tr>
                  <th>{t("Repository (glob)")}</th>
                  <th>{t("Actions")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {user.acl.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.name}</td>
                    <td>{ActionNames?.[entry.actions] ?? entry.actions}</td>
                    <td>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          removeAcl(entry.id)
                        }}
                      >
                        {t("Remove")}
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <Form.Control
                      size="sm"
                      value={addingAcl.name}
                      onChange={(e) =>
                        setAddingAcl((val) => ({
                          ...val,
                          name: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td>
                    <Form.Control
                      size="sm"
                      as="select"
                      value={addingAcl.actions}
                      onChange={(e) =>
                        setAddingAcl((val) => ({
                          ...val,
                          actions: e.target.value,
                        }))
                      }
                    >
                      <option value="pull">{ActionNames.pull}</option>
                      <option value="push">{ActionNames.push}</option>
                      <option value="pull,push">
                        {ActionNames["pull,push"]}
                      </option>
                    </Form.Control>
                  </td>
                  <td>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={addingAcl.name === ""}
                      onClick={() => {
                        addAcl
                          .onSuccess(() => {
                            setAddingAcl(DEFAULT_ACL)
                          })
                          .run({
                            user: user.id,
                            ...addingAcl,
                          })
                      }}
                    >
                      {t("Add")}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </Table>
            <p style={{ fontStyle: "italic", fontSize: "small" }}>
              (*){" "}
              <Trans i18nKey="adminRoleExplanation" t={t}>
                Admin role allows to manage users and permissions as well as to
                see the entire docker registry content without regard of own
                permissions. Push and pull operations instead require a proper
                permission to be given even to admin users.
              </Trans>
            </p>
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
                    setPasswordChangeError(
                      t("Some error occured, please try again")
                    )
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
        {deleteModalMounted && (
          <ConfirmUserDeleteModal
            user={user}
            isOpen={showDeleteModal}
            onSubmit={() => {
              remove
                .onSuccess(() => {
                  history.push("/users")
                })
                .run(user.id)
            }}
            onCancel={() => {
              closeDeleteModal()
            }}
            onClosed={onDeleteModalClosed}
          />
        )}
      </Container>
    </>
  )
}
