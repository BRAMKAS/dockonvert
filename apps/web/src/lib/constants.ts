export const APP_NAME = "DocKonvert";
export const APP_DESCRIPTION =
  "Convert any document to any format via API — by BRAMKAS INC";
export const COMPANY_NAME = "BRAMKAS INC";
export const COMPANY_URL = "https://www.bramkas.com";
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3009";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8009/api";
export const SITE_NAME =
  process.env.NEXT_PUBLIC_SITE_NAME || "DocKonvert";
export const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION || APP_DESCRIPTION;

export const INPUT_FORMATS = [
  "PDF", "DOCX", "DOC", "PPTX", "XLSX", "XLS",
  "ODT", "ODS", "ODP", "RTF", "EPUB",
  "HTML", "TXT", "CSV", "TSV", "Markdown",
  "JSON", "YAML", "XML",
  "PNG", "JPG", "WebP", "BMP", "TIFF", "SVG",
];

export const OUTPUT_FORMATS = [
  "Markdown", "PDF", "HTML", "TXT", "DOCX", "CSV", "JSON", "XML", "EPUB",
];

export const SUPPORTED_MARKDOWN_FORMATS = INPUT_FORMATS;
export const SUPPORTED_PDF_FORMATS = INPUT_FORMATS;

export const FREE_TIER = {
  name: "Free",
  rateLimit: 100,
  maxFileSizeMb: 10,
  features: [
    "100 API requests per hour",
    "10MB max file size",
    "25+ input formats",
    "9 output formats",
    "Any-to-any conversion",
    "Async jobs with webhooks",
    "24-hour document retention",
    "Community support",
  ],
};
