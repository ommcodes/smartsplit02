/**
 * parseReceipt.js
 * Parses raw OCR text from a receipt into structured data.
 */

// Lines to skip entirely — not items, not taxes
function isNonItemLine(line) {
  const l = line.trim();
  if (!l) return true;

  // Lines that are only numbers, currency symbols, punctuation — no description text
  if (/^[₹$\s\d,.\-+×x*%:()\|\/\\]+$/.test(l)) return true;

  // Table headers (whole line is just column labels)
  if (/^\s*(item|items|qty|quantity|rate|amount|sr\.?|sl\.?|s\.?no\.?|description|particulars|price|mrp|unit|units|hsn)\s*$/i.test(l)) return true;

  // Address lines
  if (/\b(road|rd\b|street|st\b|avenue|ave\b|lane\b|city|town|pin\s*code|pincode|zip\s*code|zipcode|district|state|nagar|marg|chowk|sector|block|floor|building|complex)\b/i.test(l)) return true;

  // Phone numbers (keyword or 10+ consecutive digits)
  if (/\b(tel|tele|ph\b|phone|mobile|mob\b|fax|contact|helpline|call)\b/i.test(l)) return true;
  if (/\b\d{10,}\b/.test(l)) return true;

  // Tax / business registration identifiers
  if (/\b(gstin|gst\s*no\.?|gst\s*number|gst\s*reg|tin\b|fssai|pan\b|cin\b|reg\.?\s*no\.?|license\s*no|dl\s*no)\b/i.test(l)) return true;

  // Date, time, invoice/bill headers
  if (/\b(date|time|invoice(\s*(no\.?|#|num))?|bill(\s*(no\.?|#|num))?|order(\s*(no\.?|#|num))?|receipt(\s*(no\.?|#|num))?|table(\s*(no\.?|#))?|txn\s*id|transaction)\b/i.test(l)) return true;
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l)) return true;   // date like 01/01/2024
  if (/\b\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?\b/i.test(l)) return true; // time like 10:30 am

  // Tax / total summary lines
  if (/\b(grand\s*total|total\s*amount|total\s*bill|total\s*due|net\s*amount|net\s*total|amount\s*due|bill\s*total|subtotal|sub\s*total|round\s*off|rounding|discount|savings|coupon|promo|offer|balance)\b/i.test(l)) return true;
  // "Total" alone (not part of an item name — guard against "Masala Total" by checking it's a short line or at start)
  if (/^\s*total\s*[:\-]?\s*[\d₹]/.test(l)) return true;

  // Payment method lines
  if (/\b(cash\b|by\s*cash|card\b|by\s*card|upi\b|change\s*due|tender|paid|payment|tip\b|gratuity|gpay|paytm|phonepay|phonepe)\b/i.test(l)) return true;

  // Footer / thank-you lines
  if (/\b(thank\s*you|thanks|visit\s*(us|again)?|welcome|feedback|enjoy\s*your|have\s*a|see\s*you|come\s*again)\b/i.test(l)) return true;

  return false;
}

// True if line is a GST/tax line (price on it should go into gst total)
function isTaxLine(line) {
  return /\b(cgst|sgst|igst|gst|tax|vat|service\s*charge|service\s*tax|cess)\b/i.test(line);
}

/**
 * Attempt to extract a trailing price from a line.
 * Returns null if no valid price found.
 */
function extractPrice(line) {
  const cleaned = line.replace(/[₹$]|Rs\.?|INR/gi, '').trim();
  const match = cleaned.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)[\s]*$/);
  if (match) {
    const val = parseFloat(match[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0) return val;
  }
  return null;
}

/**
 * Extract item name by stripping trailing price and noise.
 */
function extractName(line) {
  return line
    .replace(/[₹$]|Rs\.?|INR/gi, '')
    .replace(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)[\s]*$/, '')
    .replace(/[.…\-_|]+$/, '')         // trailing separators
    .replace(/^\s*[\d]+[\s.\-):]+/, '') // leading serial numbers: "1. " "2)"
    .trim();
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
  let detectedTotal = 0;

  for (const line of lines) {
    // Skip all non-item lines
    if (isNonItemLine(line)) continue;

    const price = extractPrice(line);
    if (price === null) continue; // no price on this line — skip

    // Tax line: accumulate into GST, don't add as item
    if (isTaxLine(line)) {
      gst += price;
      continue;
    }

    // It's a candidate item line — extract the name
    const name = extractName(line);

    // Require a meaningful text description (not just numbers/symbols)
    if (name.length < 2) continue;
    if (/^[\d\s,.\-₹$]+$/.test(name)) continue; // name is still only numbers

    items.push({
      id: crypto.randomUUID(),
      name,
      price,
    });
  }

  const subtotal = items.reduce((s, i) => s + i.price, 0);
  const total = detectedTotal > 0 ? detectedTotal : subtotal + gst;

  return {
    items,
    gst: parseFloat(gst.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Calculate split amounts per person.
 * Items with no assignment are split equally among ALL friends.
 * Returns array of { friend, itemSubtotal, gstShare, total, assignedItems }
 */
export function calculateSplit(items, friends, assignments, totalGst) {
  if (!friends.length) return [];

  const friendSubtotals = {};
  const friendItems = {};
  friends.forEach((f) => {
    friendSubtotals[f.id] = 0;
    friendItems[f.id] = [];
  });

  items.forEach((item) => {
    const assigned = assignments[item.id] || [];
    // Unassigned → everyone splits equally
    const payers = assigned.length > 0 ? assigned : friends.map((f) => f.id);
    const share = item.price / payers.length;
    payers.forEach((fid) => {
      if (friendSubtotals[fid] !== undefined) {
        friendSubtotals[fid] += share;
        friendItems[fid].push({ name: item.name, share: parseFloat(share.toFixed(2)) });
      }
    });
  });

  const grandSubtotal = Object.values(friendSubtotals).reduce((s, v) => s + v, 0);

  // Proportional GST — last person absorbs rounding remainder
  const gstShares = {};
  let allocatedGst = 0;
  const lastFriend = friends[friends.length - 1];

  friends.forEach((f, idx) => {
    if (idx === friends.length - 1) return;
    const proportion = grandSubtotal > 0 ? friendSubtotals[f.id] / grandSubtotal : 1 / friends.length;
    const share = parseFloat((proportion * totalGst).toFixed(2));
    gstShares[f.id] = share;
    allocatedGst += share;
  });
  gstShares[lastFriend.id] = parseFloat((totalGst - allocatedGst).toFixed(2));

  return friends.map((f) => ({
    friend: f,
    itemSubtotal: parseFloat(friendSubtotals[f.id].toFixed(2)),
    gstShare: gstShares[f.id] || 0,
    total: parseFloat((friendSubtotals[f.id] + (gstShares[f.id] || 0)).toFixed(2)),
    assignedItems: friendItems[f.id],
  }));
}
