const express = require("express");
const { ensureAuth } = require("../middleware/authMiddleware");
const {
  listNotifications,
  markRead,
  markAllRead,
} = require("../controllers/notificationController");

const router = express.Router();

router.use(ensureAuth);

router.get("/", listNotifications);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);

module.exports = router;

