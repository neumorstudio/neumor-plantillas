/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    { type: "doc", id: "index" },
    { type: "doc", id: "getting-started" },
    { type: "doc", id: "architecture" },
    { type: "doc", id: "authentication" },
    { type: "doc", id: "api" },
    { type: "doc", id: "configuration" },
    { type: "doc", id: "deployment" },
    { type: "doc", id: "troubleshooting" },
    {
      type: "category",
      label: "Referencias del repo",
      items: [
        "README",
        "DATABASE",
        "GUIA-SIMULACION-CLIENTES",
        "provisioning/vercel-domain-assignment",
        "security/SECURITY_CHANGELOG",
        "security/public-api-verification",
      ],
    },
  ],
};

module.exports = sidebars;
