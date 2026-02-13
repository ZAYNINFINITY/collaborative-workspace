const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

module.exports = function (passport) {
  const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
  const callbackURL =
    process.env.GITHUB_CALLBACK_URL ||
    `${serverUrl.replace(/\/+$/, "")}/api/auth/github/callback`;

  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            user.accessToken = accessToken;
            await user.save();
            return done(null, user);
          }

          // Check if user already exists with this email
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              // Link GitHub ID to existing user
              existingUser.githubId = profile.id;
              existingUser.accessToken = accessToken;
              if (!existingUser.avatarUrl && profile.photos?.[0]?.value) {
                existingUser.avatarUrl = profile.photos[0].value;
              }
              if (
                !existingUser.displayName &&
                (profile.displayName || profile.username)
              ) {
                existingUser.displayName =
                  profile.displayName || profile.username;
              }
              if (!existingUser.profileUrl && profile.profileUrl) {
                existingUser.profileUrl = profile.profileUrl;
              }
              await existingUser.save();
              return done(null, existingUser);
            }
          }

          const newUser = new User({
            githubId: profile.id,
            username: profile.username,
            displayName:
              profile.displayName || profile.username || "GitHub User",
            profileUrl: profile.profileUrl,
            avatarUrl: profile.photos?.[0]?.value,
            email: email,
            accessToken: accessToken,
          });

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${serverUrl.replace(/\/+$/, "")}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            user.accessToken = accessToken;
            await user.save();
            return done(null, user);
          }

          // Check if user already exists with this email
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              // Link Google ID to existing user
              existingUser.googleId = profile.id;
              existingUser.accessToken = accessToken;
              if (!existingUser.avatar && profile.photos?.[0]?.value) {
                existingUser.avatar = profile.photos[0].value;
              }
              await existingUser.save();
              return done(null, existingUser);
            }
          }

          const newUser = new User({
            googleId: profile.id,
            username: email ? email.split("@")[0] : `user_${Date.now()}`,
            displayName: profile.displayName || "Google User",
            email: email,
            avatar: profile.photos?.[0]?.value,
            accessToken: accessToken,
          });

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          return done(err, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};
