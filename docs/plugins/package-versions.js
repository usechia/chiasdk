const fs = require("fs");
const path = require("path");

function readVersion(pkgPath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, pkgPath), "utf8"));
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

module.exports = function packageVersionsPlugin() {
  return {
    name: "package-versions",
    async contentLoaded({ actions }) {
      actions.setGlobalData({
        sdk: readVersion("../../packages/sdk/package.json"),
        mcp: readVersion("../../packages/mcp/package.json"),
        widget: readVersion("../../packages/widget/package.json"),
      });
    },
  };
};
