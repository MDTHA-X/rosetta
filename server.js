require('dotenv').config();
const express = require('express');
const session = require('express-session');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } 
  })
);

const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback';

app.get('/auth/github', (req, res) => {
  if (!clientId) {
    return res.status(500).send('GitHub client ID is not configured. Set GITHUB_CLIENT_ID in your environment.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user user:email'
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

app.get('/auth/github/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`GitHub login failed: ${error_description || error}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code from GitHub.');
  }

  if (!clientId || !clientSecret) {
    return res.status(500).send('GitHub client credentials are not configured.');
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error(tokenResponse.data.error_description || 'No access token received from GitHub.');
    }

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'github-login-demo'
      }
    });

    req.session.user = userResponse.data;
    res.redirect('/');
  } catch (error) {
    console.error('GitHub OAuth error:', error.message);
    res.status(500).send('Unable to finish GitHub login.');
  }
});

app.get('/api/user', (req, res) => {
  res.json(req.session.user || null);
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GitHub login demo listening on http://localhost:${PORT}`);
});
