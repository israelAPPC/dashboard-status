function renderMessage(status, payload) {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html>
<body>
<script>
  (function () {
    function receiveMessage(e) {
      window.opener.postMessage(
        ${JSON.stringify(message)},
        e.origin
      );
      window.removeEventListener("message", receiveMessage, false);
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:github", "*");
  })();
</script>
</body>
</html>`;
}

exports.handler = async (event) => {
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!code) {
    return { statusCode: 400, body: "Missing code" };
  }

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.OAUTH_CLIENT_ID,
        client_secret: process.env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "text/html" },
        body: renderMessage("error", { message: data.error_description || data.error }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: renderMessage("success", { token: data.access_token, provider: "github" }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/html" },
      body: renderMessage("error", { message: String(err) }),
    };
  }
};
