import React, { useRef, useEffect } from "react"
import * as jdenticon from "jdenticon"

const Jdenticon = ({ value = "test", size = "100%" }) => {
  const icon = useRef(null)
  useEffect(() => {
    jdenticon.update(icon.current, value)
  }, [value])

  return (
    <div>
      <svg data-jdenticon-value={value} height={size} ref={icon} width={size} />
    </div>
  )
}

export default Jdenticon
