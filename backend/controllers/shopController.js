const shopService = require("../services/shopService");

function getAll(req, res) {
  try {
    const shops = shopService.getAll();
    res.json({ success: true, data: shops });
  } catch (error) {
    console.error("Error fetching shops:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch shops" });
  }
}

function upsert(req, res) {
  try {
    const { shopNumber, rentAmount, dueDate, shopName, floor } = req.body;
    if (!shopNumber) {
      return res.status(400).json({ success: false, error: "shopNumber is required" });
    }
    const shop = shopService.upsert({
      shopNumber,
      rentAmount: rentAmount || 0,
      dueDate: dueDate || "",
      shopName: shopName || "",
      floor: floor || "",
    });
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error("Error upserting shop:", error.message);
    res.status(500).json({ success: false, error: "Failed to save shop" });
  }
}

function getByNumber(req, res) {
  try {
    const { shopNumber } = req.params;
    const shop = shopService.getByShopNumber(shopNumber);
    if (!shop) {
      return res.status(404).json({ success: false, error: "Shop not found" });
    }
    res.json({ success: true, data: shop });
  } catch (error) {
    console.error("Error fetching shop:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch shop" });
  }
}

module.exports = { getAll, upsert, getByNumber };
