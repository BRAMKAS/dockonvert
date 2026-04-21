"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

export default function DocsPage() {
  return (
    <div className="min-h-screen">
      <ApiReferenceReact
        configuration={{
          url: "/openapi.json",
          theme: "kepler",
          layout: "modern",
          hideModels: false,
          hideDownloadButton: false,
          metadata: {
            title: "DocKonvert API Reference",
          },
          authentication: {
            preferredSecurityScheme: "apiKey",
            apiKey: {
              token: "",
            },
          },
        }}
      />
    </div>
  );
}
