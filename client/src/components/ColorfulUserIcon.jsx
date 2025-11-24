import React from "react"

function stringToHslColor(str, s, l) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  var h = hash % 360
  return "hsl(" + h + ", " + s + "%, " + l + "%)"
}

export default function ColorfulUserIcon({ user }) {
  const fullNameArray =
    user.first_name && user.last_name
      ? [user.first_name, user.last_name]
      : [user.username]
  const letters = fullNameArray
    .map((str) => str.charAt(0).toUpperCase())
    .join("")
  const fullName = fullNameArray.join(" ")

  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: stringToHslColor(fullName, 80, 50),
      }}
      className="d-flex flex-row justify-content-center align-items-center text-white"
    >
      {letters}
    </div>
  )
}
