const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shopController");

// GET /api/shops - get all shops
router.get("/", shopController.getAll);

// GET /api/shops/:shopNumber - get shop by number
router.get("/:shopNumber", shopController.getByNumber);

// POST /api/shops - create or update a shop
router.post("/", shopController.upsert);

module.exports = router;
