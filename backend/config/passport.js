const GitHubStrategy = require("passport-github2").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const User = require("../models/User");

module.exports = function (passport) {
  const normalizedClientUrl = (
    process.env.CLIENT_URL || "http://localhost:3000"
  ).replace(/\/+$/, "");

  const serverUrl = (
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === "production"
      ? normalizedClientUrl
      : "http://localhost:5000")
  ).replace(/\/+$/, "");

  // OAuth callbacks should land on the public origin that the browser is on so
  // auth cookies are scoped correctly (especially when Vercel proxies `/api/*`).
  // You can override this explicitly via OAUTH_PUBLIC_BASE_URL.
  const oauthPublicBaseUrl = (
    process.env.OAUTH_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === "production" ? normalizedClientUrl : serverUrl) ||
    serverUrl
  ).replace(/\/+$/, "");

  const githubCallbackURL =
    process.env.GITHUB_CALLBACK_URL ||
    `${oauthPublicBaseUrl}/api/auth/github/callback`;

  // ===== LOCAL STRATEGY FOR EMAIL/PASSWORD =====
  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await User.findOne({ email }).select("+password");

          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          // Check if password field exists (might be OAuth-only user)
          if (!user.password) {
            return done(null, false, {
              message: "User authenticated via OAuth only",
            });
          }

          // Compare password
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            return done(null, false, { message: "Invalid password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  // ===== GITHUB STRATEGY =====
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: githubCallbackURL,
          state: true,
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
  }

  // ===== GOOGLE STRATEGY =====
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            `${oauthPublicBaseUrl}/api/auth/google/callback`,
          state: true,
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
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      if (!id) {
        console.warn("⚠️ Deserialize called with null/undefined id");
        return done(null, false);
      }

      const user = await User.findById(id);
      if (!user) {
        console.warn(`⚠️ User not found during deserialization: ${id}`);
        return done(null, false);
      }

      console.log(`✅ User deserialized successfully: ${user.email}`);
      done(null, user);
    } catch (err) {
      console.error("❌ Deserialization error:", err.message);
      done(err, null);
    }
  });
};
