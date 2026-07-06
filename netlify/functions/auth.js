exports.handler = async (event) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const siteUrl = process.env.URL || "";
  const redirectUri = `${siteUrl}/api/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo,user",
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params.toString()}`,
    },
  };
};
