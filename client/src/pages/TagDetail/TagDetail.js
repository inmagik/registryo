import React from "react"
import Navbar from "../../components/Navbar"
import useManifest, { useDeleteManifest } from "../../hooks/useManifest"
import Container from "react-bootstrap/Container"
import Table from "react-bootstrap/Table"
import { useTranslation } from "react-i18next"
import { Button, Col, Row } from "react-bootstrap"

function formatSize(bytes) {
  if (bytes < 1000) {
    return bytes + " B"
  } else if (bytes < 1000 ** 2) {
    return (bytes / 1000).toFixed(2) + " kB"
  } else if (bytes < 1000 ** 3) {
    return (bytes / 1000 ** 2).toFixed(2) + " MB"
  } else if (bytes < 1000 ** 4) {
    return (bytes / 1000 ** 3).toFixed(2) + " GB"
  }
  return (bytes / 1000 ** 4).toFixed(2) + " TB"
}

export default function TagDetail({ history, match }) {
  const repoName = match.params.repoName
  const refName = match.params.refName

  const [{ data: manifest }] = useManifest(repoName, refName)
  const [, { run: deleteManifest }] = useDeleteManifest()
  const { t } = useTranslation()

  return (
    <>
      <Navbar />
      <Container style={{ paddingTop: 100 }}>
        <Row>
          <Col>
            <h1>
              {repoName}:{refName}
            </h1>
          </Col>
          <Col className="d-flex flex-row justify-content-end align-items-center">
            <Button
              variant="danger"
              onClick={() => {
                const check = window.confirm(t("delete-tag", { tag: repoName + ":" + refName }))
                if (check) {
                  deleteManifest
                    .onSuccess(() => {
                      history.goBack()
                    })
                    .run(repoName, manifest.digest)
                }
              }}
            >
              {t("delete")}
            </Button>
          </Col>
        </Row>
        {manifest && (
          <div>
            <p className="h3">{t("Info")}</p>
            <Table
              striped
              bordered
              size="sm"
              style={{ tableLayout: "fixed" }}
            >
              <tbody>
                <tr>
                  <td>{t("Number of layers")}</td>
                  <td>{manifest.layers.length}</td>
                </tr>
                <tr>
                  <td>{t("Overall size")}</td>
                  <td>{formatSize(manifest.size)}</td>
                </tr>
                <tr>
                  <td>{t("Last push date")}</td>
                  <td>
                    {Intl.DateTimeFormat("default", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    }).format(new Date(manifest.created))}
                  </td>
                </tr>
              </tbody>
            </Table>
            <p className="h3">{t("Build history")}</p>
            <Table
              striped
              className="w-100"
              style={{ maxWidth: "100%", tableLayout: "fixed" }}
            >
              <thead>
                <tr>
                  <th style={{ width: "20%" }}>{t("Id")}</th>
                  <th style={{ width: "60%" }}>{t("Command")}</th>
                  <th style={{ width: "20%" }}>{t("Size")}</th>
                </tr>
              </thead>
              <tbody>
                {manifest.layers.map((entry, i) => {
                  const cmd = entry.command.replace(/ &&/g, "\n&&")
                  return (
                    <tr key={i}>
                      <td>
                        <span title={entry.digest}>
                          {entry.digest.slice(7, 17)}
                        </span>
                      </td>
                      <td>
                        <code style={{ whiteSpace: "pre-wrap" }}>{cmd}</code>
                      </td>
                      <td className="text-right">{formatSize(entry.size)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Container>
    </>
  )
}
