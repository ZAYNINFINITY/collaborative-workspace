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
          // First check if user exists by GitHub ID
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            user.accessToken = accessToken;
            user.refreshToken = refreshToken || user.refreshToken;
            await user.save();
            return done(null, user);
          }

          // Try to find by email if available
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              // Link GitHub ID to existing user
              existingUser.githubId = profile.id;
              existingUser.accessToken = accessToken;
              existingUser.refreshToken =
                refreshToken || existingUser.refreshToken;
              if (!existingUser.avatar && profile.photos?.[0]?.value) {
                existingUser.avatar = profile.photos[0].value;
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

          // Create new user
          const newUserData = {
            githubId: profile.id,
            username: profile.username || `github_${profile.id}`,
            displayName:
              profile.displayName || profile.username || "GitHub User",
            profileUrl:
              profile.profileUrl || `https://github.com/${profile.username}`,
            avatar: profile.photos?.[0]?.value,
            accessToken: accessToken,
          };

          // Only include email if it exists
          if (email) {
            newUserData.email = email;
          }

          // Only include refreshToken if it exists
          if (refreshToken) {
            newUserData.refreshToken = refreshToken;
          }

          const newUser = new User(newUserData);

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          console.error("GitHub Strategy Error:", err);
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
          // First check if user exists by Google ID
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            user.accessToken = accessToken;
            user.refreshToken = refreshToken || user.refreshToken;
            await user.save();
            return done(null, user);
          }

          // Try to find by email if available
          const email = profile.emails?.[0]?.value;
          if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
              // Link Google ID to existing user
              existingUser.googleId = profile.id;
              existingUser.accessToken = accessToken;
              existingUser.refreshToken =
                refreshToken || existingUser.refreshToken;
              if (!existingUser.avatar && profile.photos?.[0]?.value) {
                existingUser.avatar = profile.photos[0].value;
              }
              if (!existingUser.displayName && profile.displayName) {
                existingUser.displayName = profile.displayName;
              }
              await existingUser.save();
              return done(null, existingUser);
            }
          }

          // Create new user
          const newUserData = {
            googleId: profile.id,
            username: email ? email.split("@")[0] : `google_${profile.id}`,
            displayName: profile.displayName || "Google User",
            avatar: profile.photos?.[0]?.value,
            accessToken: accessToken,
          };

          // Only include email if it exists
          if (email) {
            newUserData.email = email;
          }

          // Only include refreshToken if it exists
          if (refreshToken) {
            newUserData.refreshToken = refreshToken;
          }

          const newUser = new User(newUserData);

          await newUser.save();
          return done(null, newUser);
        } catch (err) {
          console.error("Google Strategy Error:", err);
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
