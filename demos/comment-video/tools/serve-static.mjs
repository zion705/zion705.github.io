import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.resolve(scriptDirectory, "../../..");
const rootDirectory = path.resolve(process.argv[2] || defaultRoot);
const port = Number(process.argv[3] || 18765);

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mp4", "video/mp4"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
]);

function send(response, status, body, headers = {}) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    ...headers,
  });
  if (body && response.req.method !== "HEAD") {
    response.end(body);
  } else {
    response.end();
  }
}

const server = http.createServer((request, response) => {
  try {
    const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const decodedPath = decodeURIComponent(requestUrl.pathname);
    let requestedPath = path.resolve(rootDirectory, `.${decodedPath}`);

    if (
      requestedPath !== rootDirectory &&
      !requestedPath.startsWith(`${rootDirectory}${path.sep}`)
    ) {
      send(response, 403, "Forbidden");
      return;
    }

    if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isDirectory()) {
      requestedPath = path.join(requestedPath, "index.html");
    }

    if (!fs.existsSync(requestedPath) || !fs.statSync(requestedPath).isFile()) {
      send(response, 404, "Not found");
      return;
    }

    const stat = fs.statSync(requestedPath);
    const contentType = mimeTypes.get(path.extname(requestedPath).toLowerCase()) ||
      "application/octet-stream";
    const range = request.headers.range;

    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match) {
        send(response, 416, "Invalid range", {
          "Content-Range": `bytes */${stat.size}`,
        });
        return;
      }

      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Number(match[2]) : stat.size - 1;
      if (start > end || end >= stat.size) {
        send(response, 416, "Range not satisfiable", {
          "Content-Range": `bytes */${stat.size}`,
        });
        return;
      }

      response.writeHead(206, {
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store",
        "Content-Length": end - start + 1,
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Content-Type": contentType,
      });
      if (request.method === "HEAD") {
        response.end();
      } else {
        fs.createReadStream(requestedPath, { start, end }).pipe(response);
      }
      return;
    }

    response.writeHead(200, {
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-store",
      "Content-Length": stat.size,
      "Content-Type": contentType,
    });
    if (request.method === "HEAD") {
      response.end();
    } else {
      fs.createReadStream(requestedPath).pipe(response);
    }
  } catch {
    send(response, 500, "Internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${rootDirectory} at http://127.0.0.1:${port}`);
});

