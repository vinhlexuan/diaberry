require('dotenv').config();

const handleGoogleSignIn = (req, res) => {
  // Supabase OAuth URL for Google (will be handled by the frontend)
  const supabaseUrl = process.env.SUPABASE_URL;
  const oauthURL = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/callback`;
  res.redirect(oauthURL);
};

const handleCallback = (req, res) => {
  // Extract the access token from the URL fragment or query
  // With Supabase, token handling is usually done client-side
  res.send("Callback received. Token handled by client.");
};

module.exports = {
  handleGoogleSignIn,
  handleCallback
};