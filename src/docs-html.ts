export function swaggerHtml(spec: unknown): string {
  const json = JSON.stringify(spec).replaceAll("</", "<\\/");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Koppa API</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      spec: ${json},
      dom_id: "#swagger-ui",
      deepLinking: true
    });
  </script>
</body>
</html>`;
}

export function redocHtml(spec: unknown): string {
  const json = JSON.stringify(spec).replaceAll("</", "<\\/");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Koppa API</title>
  <style>body { margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="redoc"></div>
  <script src="https://cdn.jsdelivr.net/npm/redoc@2.1.5/bundles/redoc.standalone.js"></script>
  <script>
    Redoc.init(${json}, {}, document.getElementById("redoc"));
  </script>
</body>
</html>`;
}
