/**
 * parseReceipt.js
 * Parses raw OCR text from a receipt image into structured data.
 */

const TAX_KEYWORDS = /\b(gst|cgst|sgst|igst|tax|vat|service\s*charge|service\s*tax)\b/i;
const TOTAL_KEYWORDS = /\b(grand\s*total|total\s*amount|total\s*bill|total\s*due|net\s*amount|net\s*total|amount\s*due|bill\s*total|total)\b/i;
const SKIP_KEYWORDS = /\b(discount|savings|coupon|promo|offer|sub[\s-]?total|subtotal|balance|change|paid|cash|card|upi|tip|gratuity)\b/i;

/**
 * Attempt to extract a price from the end of a line.
 * Supports: ₹123, Rs.123, 123.00, 1,234.56
 */
function extractPrice(line) {
  // Remove ₹, Rs., INR prefix/suffix
  const cleaned = line.replace(/[₹$]|Rs\.?|INR/gi, '').trim();
  // Match trailing number (possibly with commas)
  const match = cleaned.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)[\s]*$/);
  if (match) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }
  return null;
}

/**
 * Extract item name from a line by removing the trailing price and noise.
 */
function extractName(line) {
  // Remove price at end
  const name = line
    .replace(/[₹$]|Rs\.?|INR/gi, '')
    .replace(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)[\s]*$/, '')
    .replace(/[.…\-_|]+$/, '') // trailing separators
    .replace(/^\s*[\d]+[\s.\-):]+/, '') // leading serial numbers like "1. " or "1)"
    .trim();
  return name;
}

/**
 * Main parser: takes raw OCR text and returns { items, gst, total }
 */
export function parseReceiptText(rawText) {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items = [];
  let gst = 0;
  let total = 0;
  let detectedTotal = 0;

  for (const line of lines) {
    const price = extractPrice(line);
    if (price === null) continue; // no price on this line, skip

    const lineLower = line.toLowerCase();

    // Check if it's a tax line
    if (TAX_KEYWORDS.test(lineLower)) {
      gst += price;
      continue;
    }

    // Check if it's a total line
    if (TOTAL_KEYWORDS.test(lineLower)) {
      if (price > detectedTotal) detectedTotal = price;
      continue;
    }

    // Skip discount/subtotal/payment lines
    if (SKIP_KEYWORDS.test(lineLower)) continue;

    // It's likely an item line
    const name = extractName(line);
    if (name.length < 2) continue; // too short to be a real item

    items.push({
      id: crypto.randomUUID(),
      name,
      price,
    });
  }

  // Use detected total or sum items+gst as fallback
  total = detectedTotal > 0 ? detectedTotal : items.reduce((s, i) => s + i.price, 0) + gst;

  return { items, gst: parseFloat(gst.toFixed(2)), total: parseFloat(total.toFixed(2)) };
}

/**
 * Calculate split amounts per person.
 * Returns array of { friend, itemSubtotal, gstShare, total, assignedItems }
 */
export function calculateSplit(items, friends, assignments, totalGst) {
  if (!friends.length) return [];

  // Build per-friend subtotals
  const friendSubtotals = {};
  const friendItems = {};
  friends.forEach((f) => {
    friendSubtotals[f.id] = 0;
    friendItems[f.id] = [];
  });

  items.forEach((item) => {
    const assigned = assignments[item.id] || [];
    if (!assigned.length) return;
    const share = item.price / assigned.length;
    assigned.forEach((fid) => {
      if (friendSubtotals[fid] !== undefined) {
        friendSubtotals[fid] += share;
        friendItems[fid].push({ name: item.name, share: parseFloat(share.toFixed(2)) });
      }
    });
  });

  const grandSubtotal = Object.values(friendSubtotals).reduce((s, v) => s + v, 0);

  // Calculate proportional GST
  const gstShares = {};
  let allocatedGst = 0;
  const lastFriend = friends[friends.length - 1];

  friends.forEach((f, idx) => {
    if (idx === friends.length - 1) return; // handle last separately
    const proportion = grandSubtotal > 0 ? friendSubtotals[f.id] / grandSubtotal : 1 / friends.length;
    const share = parseFloat((proportion * totalGst).toFixed(2));
    gstShares[f.id] = share;
    allocatedGst += share;
  });

  // Last person gets remainder to ensure sum == totalGst
  gstShares[lastFriend.id] = parseFloat((totalGst - allocatedGst).toFixed(2));

  return friends.map((f) => ({
    friend: f,
    itemSubtotal: parseFloat(friendSubtotals[f.id].toFixed(2)),
    gstShare: gstShares[f.id] || 0,
    total: parseFloat((friendSubtotals[f.id] + (gstShares[f.id] || 0)).toFixed(2)),
    assignedItems: friendItems[f.id],
  }));
}
