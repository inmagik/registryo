import { Field, Formik } from "formik"
import React from "react"
import Button from "react-bootstrap/Button"
import Container from "react-bootstrap/Container"
import Form from "react-bootstrap/Form"
import { useTranslation } from "react-i18next"
import Navbar from "../../components/Navbar"
import useNewUser from "../../hooks/useNewUser"

const USER_DEFAULTS = {
  username: "",
  set_password: "",
  first_name: "",
  last_name: "",
  email: "",
  is_staff: false,
}

function InputField({ field, form, ...props }) {
  return <Form.Control {...props} {...field} />
}

function CheckField({ field, form, ...props }) {
  const { value, ...other } = field
  return <Form.Check {...props} checked={value} {...other} />
}

export default function UserCreate({ history }) {
  const [, { run: create }] = useNewUser()
  const { t } = useTranslation()

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <div>
          <div className="d-flex flex-row justify-content-between align-items-end mb-1">
            <h1 className="m-0">{t("New user")}</h1>
          </div>
          <hr className="mb-3 mt-0" />
          <Formik
            initialValues={USER_DEFAULTS}
            onSubmit={(values) => {
              return create.asPromise(values).then(() => {
                history.push("/users")
              })
            }}
          >
            {(formik) => (
              <Form onSubmit={formik.handleSubmit}>
                <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                  <label htmlFor="username-input" className="flex-1 m-0">
                    <b className="mr-2">{t("Username")}:</b>
                  </label>
                  <div className="flex-4">
                    <Field
                      name="username"
                      id="username-input"
                      component={InputField}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="d-flex flex-row justify-content-start align-items-center mb-2 ">
                  <label htmlFor="password-input" className="flex-1 m-0">
                    <b className="mr-2">{t("Password")}:</b>
                  </label>
                  <div className="flex-4">
                    <Field
                      name="set_password"
                      id="password-input"
                      component={InputField}
                      type="password"
                      size="sm"
                    />
                  </div>
                </div>
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
                    <b className="mr-2">{t("Admin role")}:</b>
                  </label>
                  <div className="flex-4">
                    <Field
                      name="is_staff"
                      id="is-staff-input"
                      component={CheckField}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <Button variant="success" type="submit" size="sm">
                    {t("Save")}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </Container>
    </>
  )
}
