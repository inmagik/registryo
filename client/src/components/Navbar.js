import React from "react"
import BsNavbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import { Link } from "react-router-dom"
import { useAuthActions, useAuthUser } from "use-eazy-auth"
import { useTranslation } from "react-i18next"

export default function Navbar() {
  const { user } = useAuthUser()
  const { logout } = useAuthActions()
  const { t } = useTranslation()

  return (
    <BsNavbar fixed="top" variant="dark" bg="dark" expand="md">
      <BsNavbar.Brand as={Link} to="/">
        Web Registry
      </BsNavbar.Brand>
      <BsNavbar.Toggle aria-controls="basic-navbar-nav" />
      <BsNavbar.Collapse id="basic-navbar-nav">
        <Nav className="mr-auto">
          <Nav.Link as={Link} to="/">
            {t("Home")}
          </Nav.Link>
          {user.is_staff && (
            <Nav.Link as={Link} to="/users">
              {t("Users")}
            </Nav.Link>
          )}
        </Nav>
        <Nav>
          <Nav.Link as={Link} to="/me">
            {user.username}
          </Nav.Link>
          <Nav.Link as={"span"} className="pointer" onClick={() => logout()}>
            {t("Logout")}
          </Nav.Link>
        </Nav>
      </BsNavbar.Collapse>
    </BsNavbar>
  )
}
