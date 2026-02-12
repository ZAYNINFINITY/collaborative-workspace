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

          const newUser = new User({
            githubId: profile.id,
            username: profile.username,
            displayName: profile.displayName,
            profileUrl: profile.profileUrl,
            avatarUrl: profile.photos?.[0]?.value,
            email: profile.emails ? profile.emails[0].value : null,
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

          const newUser = new User({
            googleId: profile.id,
            username: profile.emails[0].value.split("@")[0],
            displayName: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos?.[0]?.value,
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
