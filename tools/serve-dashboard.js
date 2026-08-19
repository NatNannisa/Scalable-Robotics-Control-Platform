const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");

const staticRoot = path.resolve(__dirname, "..", "frontend", "static");
const nextPublicRoot = path.resolve(__dirname, "..", "frontend", "next", "public");
const port = Number(process.env.STATIC_PORT || 8080);
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml"
};

http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const isSharedPublicAsset = relativePath.startsWith(`public${path.sep}`) || relativePath.startsWith("public/");
  const assetRelativePath = isSharedPublicAsset ? relativePath.replace(/^public[\\/]/, "") : relativePath;
  const root = isSharedPublicAsset ? nextPublicRoot : staticRoot;
  const filePath = path.resolve(root, assetRelativePath);

  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403);
    return response.end("Forbidden");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500);
      return response.end(error.code === "ENOENT" ? "Not found" : "Server error");
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  });
}).listen(port, () => {
  console.log(`Dashboard available at http://localhost:${port}`);
});
