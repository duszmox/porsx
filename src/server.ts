import http, { IncomingMessage, RequestOptions, ServerResponse } from "http";
import https from "https";
import { URL } from "url";

const PORT = Number(process.env.PORT) || 4000;
const TARGET = process.env.TARGET || "http://localhost:3000";

const targetUrl = new URL(TARGET);
const targetClient = targetUrl.protocol === "https:" ? https : http;
const defaultAllowHeaders =
  "Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin";

const setCorsHeaders = (req: IncomingMessage, res: ServerResponse): void => {
  const requestedHeaders = req.headers["access-control-request-headers"];
  const allowHeaders =
    typeof requestedHeaders === "string"
      ? requestedHeaders
      : defaultAllowHeaders;

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", allowHeaders);
};

const server = http.createServer((clientReq, clientRes) => {
  setCorsHeaders(clientReq, clientRes);

  if (clientReq.method === "OPTIONS") {
    clientRes.writeHead(200);
    clientRes.end();
    return;
  }

  const forwardedHeaders: http.OutgoingHttpHeaders = {
    ...clientReq.headers,
    host: targetUrl.host,
    origin: targetUrl.origin,
    referer: targetUrl.origin,
  };

  const requestOptions: RequestOptions = {
    protocol: targetUrl.protocol,
    hostname: targetUrl.hostname,
    port:
      Number(targetUrl.port) || (targetUrl.protocol === "https:" ? 443 : 80),
    method: clientReq.method,
    path: clientReq.url,
    headers: forwardedHeaders,
  };

  const proxyReq = targetClient.request(requestOptions, (proxyRes) => {
    const responseHeaders: http.OutgoingHttpHeaders = { ...proxyRes.headers };
    const upstreamAllowHeaders =
      proxyRes.headers["access-control-allow-headers"];
    const resolvedAllowHeaders =
      typeof upstreamAllowHeaders === "string"
        ? upstreamAllowHeaders
        : defaultAllowHeaders;

    responseHeaders["access-control-allow-origin"] = "*";
    responseHeaders["access-control-allow-methods"] =
      "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    responseHeaders["access-control-allow-headers"] = resolvedAllowHeaders;

    clientRes.writeHead(proxyRes.statusCode ?? 500, responseHeaders);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on("error", (err: NodeJS.ErrnoException) => {
    console.error("Proxy request failed:", err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { "content-type": "application/json" });
    }
    clientRes.end(
      JSON.stringify({ error: "Bad gateway", details: err.message })
    );
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`CORS proxy listening on http://localhost:${PORT} -> ${TARGET}`);
});
