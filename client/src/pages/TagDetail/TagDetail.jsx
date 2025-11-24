import React from "react";
import Navbar from "../../components/Navbar";
import useManifest, {
  useDeleteBlob,
  useDeleteManifest,
} from "../../hooks/useManifest";
import Container from "react-bootstrap/Container";
import Table from "react-bootstrap/Table";
import { useTranslation } from "react-i18next";
import { Button, Col, Row, Tabs, Tab } from "react-bootstrap";

function formatSize(bytes) {
  if (bytes < 1000) {
    return bytes + " B";
  } else if (bytes < 1000 ** 2) {
    return (bytes / 1000).toFixed(2) + " kB";
  } else if (bytes < 1000 ** 3) {
    return (bytes / 1000 ** 2).toFixed(2) + " MB";
  } else if (bytes < 1000 ** 4) {
    return (bytes / 1000 ** 3).toFixed(2) + " GB";
  }
  return (bytes / 1000 ** 4).toFixed(2) + " TB";
}

export default function TagDetail({ match }) {
  const repoName = match.params.repoName;
  const refName = match.params.refName;

  const [{ data: manifestIndex, error }] = useManifest(repoName, refName);
  const [, { run: deleteManifest }] = useDeleteManifest();
  const [, { run: deleteBlob }] = useDeleteBlob();
  const { t } = useTranslation();

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
        </Row>
        {error && (
          <div>{t("manifest-fetch-error")}</div>
        )}
        {manifestIndex && (
          <Tabs>
            {manifestIndex?.manifests?.map((manifest, idx) => {
              let platform = manifest.os + "/" + manifest.arch;
              if (platform === "*/*") {
                platform = t("all-platforms");
              }

              return (
                <Tab eventKey={platform} title={platform} key={idx}>
                  <div>
                    <p className="h3 mt-3">{t("Info")}</p>
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
                          <td>
                            {formatSize(
                              manifest.layers.reduce((a, b) => a + b.size, 0)
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <p className="h3">{t("Layers")}</p>
                    <Table
                      striped
                      className="w-100"
                      style={{ maxWidth: "100%", tableLayout: "fixed" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "60%" }}>{t("Id")}</th>
                          <th style={{ width: "20%" }}>{t("Size")}</th>
                          <th style={{ width: "20%" }}>{t("Actions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {manifest.layers.map((entry, i) => {
                          return (
                            <tr key={i}>
                              <td>
                                <span title={entry.digest}>
                                  {entry.digest.slice(7, 17)}
                                </span>
                              </td>
                              <td className="text-right">
                                {formatSize(entry.size)}
                              </td>
                              <td>
                                <Col className="d-flex flex-row justify-content-end align-items-center">
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => {
                                      const check = window.confirm(
                                        t("delete-blob", {
                                          blob: entry.digest.slice(7, 17),
                                        })
                                      );
                                      if (check) {
                                        deleteBlob
                                          .onSuccess(() => {
                                            window.alert(t("blob-deleted"));
                                          })
                                          .run(repoName, entry.digest);
                                      }
                                    }}
                                  >
                                    {t("delete")}
                                  </Button>
                                </Col>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                    {manifest.digest && (
                      <div className="mb-4">
                        <p className="h3">{t("Actions")}</p>
                        <Button
                          variant="danger"
                          onClick={() => {
                            const check = window.confirm(
                              t("delete-tag", { tag: repoName + ":" + refName })
                            );
                            if (check) {
                              deleteManifest
                                .onSuccess(() => {
                                  history.goBack();
                                })
                                .run(repoName, manifest.digest);
                            }
                          }}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    )}
                  </div>
                </Tab>
              );
            })}
          </Tabs>
        )}
      </Container>
    </>
  );
}
