const path = require("path");

const siteUrl = process.env.DOCS_SITE_URL || "http://localhost:4000";
const baseUrl = process.env.DOCS_BASE_URL || "/docs/";

/** @type {import('@docusaurus/types').Config} */
module.exports = {
  title: "NeumorStudio Docs",
  tagline: "Documentación técnica de neumor-plantillas",
  url: siteUrl,
  baseUrl,
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "throw",
  organizationName: "neumorstudio",
  projectName: "neumor-plantillas",
  presets: [
    [
      "classic",
      {
        docs: {
          path: path.resolve(__dirname, "../../docs"),
          routeBasePath: "/",
          sidebarPath: path.resolve(__dirname, "../../sidebars.js"),
        },
        blog: false,
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "NeumorStudio",
      items: [
        {
          type: "doc",
          docId: "index",
          position: "left",
          label: "Docs",
        },
      ],
    },
    footer: {
      style: "light",
      links: [],
      copyright: `© ${new Date().getFullYear()} NeumorStudio`,
    },
  },
};
