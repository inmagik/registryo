import React from "react"
import Container from "react-bootstrap/Container"
import Jdenticon from "../../components/Jdenticon"
import Navbar from "../../components/Navbar"
import { useRepositoryTags } from "../../hooks/useRepositoryTags"

export default function RepoDetails({ history, match }) {
  const repoName = match.params.repoName
  const [{ data: tags }] = useRepositoryTags(repoName)

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <h1>{repoName}</h1>
        {tags && (
          <div>
            {tags.tags.map((tag) => {
              return (
                <div
                  onClick={() => {
                    history.push(`/repositories/${repoName}/tag/${tag}`)
                  }}
                  key={tag}
                  className="bg-white shadow-sm rounded my-3 py-2 px-3 d-flex flex-row align-items-center pointer"
                >
                  <div className="mr-3">
                    <Jdenticon size="32" value={`${repoName}:${tag}`} />
                  </div>
                  {tag}
                </div>
              )
            })}
          </div>
        )}
      </Container>
    </>
  )
}
