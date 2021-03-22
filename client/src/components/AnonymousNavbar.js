import React from "react"
import BsNavbar from "react-bootstrap/Navbar"
import { Link } from "react-router-dom"

export default function AnonymousNavbar() {
  return (
    <BsNavbar fixed="top" variant="dark" bg="dark" expand="md">
      <BsNavbar.Brand as={Link} to="/">Registryo</BsNavbar.Brand>
    </BsNavbar>
  )
}
