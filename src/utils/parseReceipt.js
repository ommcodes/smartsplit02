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

  // Table header rows — any line composed entirely of column-label words
  const HEADER_TOKEN = /^(s\.?no\.?|sr\.?|sl\.?|sno|item|items|description|desc|particulars|qty|quantity|rate|price|mrp|amount|amt|total|hsn|unit|units|disc|discount|tax|cgst|sgst|igst|gst|vat|tc|t&c|no\.?|nbr|#)$/i;
  const tokens = l.split(/[\s|,\t/\\]+/).filter(Boolean);
  if (tokens.length > 0 && tokens.every((t) => HEADER_TOKEN.test(t))) return true;

  // Address lines
  if (/\b(road|rd\b|street|st\b|avenue|ave\b|lane\b|city|town|pin\s*code|pincode|zip\s*code|zipcode|district|state|nagar|marg|chowk|sector|block|floor|building|complex)\b/i.test(l)) return true;

  // Phone numbers (keyword or 10+ consecutive digits)
  if (/\b(tel|tele|ph\b|phone|mobile|mob\b|fax|contact|helpline|call)\b/i.test(l)) return true;
  if (/\b\d{10,}\b/.test(l)) return true;

  // Tax / business registration identifiers
  if (/\b(gstin|gst\s*no\.?|gst\s*number|gst\s*reg|tin\b|fssai|pan\b|cin\b|reg\.?\s*no\.?|license\s*no|dl\s*no)\b/i.test(l)) return true;

  // Reference number indicators
  if (/\bno\s*[.:]/i.test(l)) return true;
  if (/\bnbr\b/i.test(l)) return true;
  if (/#\s*\d/.test(l)) return true;

  // Taxable amount lines
  if (/\btaxable\b/i.test(l)) return true;

  // Date, time, invoice/bill headers
  if (/\b(date|time|invoice(\s*(no\.?|#|num))?|bill(\s*(no\.?|#|num))?|order(\s*(no\.?|#|num))?|receipt(\s*(no\.?|#|num))?|table(\s*(no\.?|#))?|txn\s*id|transaction)\b/i.test(l)) return true;
  if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(l)) return true;
  if (/\b\d{1,2}:\d{2}(:\d{2})?(\s*(am|pm))?\b/i.test(l)) return true;

  // Tax / total summary lines
  if (/\b(grand\s*total|total\s*amount|total\s*bill|total\s*due|net\s*amount|net\s*total|amount\s*due|bill\s*total|subtotal|sub\s*total|round\s*off|rounding|discount|savings|coupon|promo|offer|balance)\b/i.test(l)) return true;
  if (/^\s*total\s*[:\-]?\s*[\d₹]/.test(l)) return true;

  // Payment method lines
  if (/\b(cash\b|by\s*cash|card\b|by\s*card|upi\b|change\s*due|tender|paid|payment|tip\b|gratuity|gpay|paytm|phonepay|phonepe)\b/i.test(l)) return true;

  // Footer / thank-you / T&C lines
  if (/\b(thank\s*you|thanks|visit\s*(us|again)?|welcome|feedback|enjoy\s*your|have\s*a|see\s*you|come\s*again|t\s*&\s*c|terms\s*(&|and)\s*conditions?|conditions?\s*apply)\b/i.test(l)) return true;
  if (/^\s*tc\s*[:\-]?/i.test(l)) return true;

  return false;
}

// True if line is a GST/tax/rate line
function isTaxLine(line) {
  if (/\b(cgst|sgst|igst|gst|tax|vat|service\s*charge|service\s*tax|cess)\b/i.test(line)) return true;
  if (/\d\s*%/.test(line)) return true;
  return false;
}

/**
 * Attempt to extract a trailing price from a line.
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
    .replace(/[.…\-_|]+$/, '')
    .replace(/^\s*[\d]+[\s.\-):]+/, '')
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

  const TOTALS_BOUNDARY = /\b(subtotal|sub\s*total|grand\s*total|total\s*amount|net\s*amount|net\s*total|amount\s*due|bill\s*total|balance\s*due)\b/i;

  const items = [];
  let gst = 0;
  let crossedTotals = false;
  let detectedTotal = 0;

  for (const line of lines) {
    if (!crossedTotals && (isTaxLine(line) || TOTALS_BOUNDARY.test(line))) {
      crossedTotals = true;
    }

    const price = extractPrice(line);
    if (price === null) continue;

    if (isTaxLine(line)) {
      gst += price;
      continue;
    }

    if (isNonItemLine(line)) continue;
    if (crossedTotals) continue;

    const name = extractName(line);
    if (name.length < 2) continue;
    if (/^[\d\s,.\-₹$]+$/.test(name)) continue;

    items.push({ id: crypto.randomUUID(), name, price });
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
 * tip: { amount: number, mode: 'equal'|'proportional'|'progressive' } or null
 * Returns array of { friend, itemSubtotal, gstShare, tipShare, total, assignedItems }
 */
export function calculateSplit(items, friends, assignments, totalGst, tip = null) {
  if (!friends.length) return [];

  const friendSubtotals = {};
  const friendItems = {};
  friends.forEach((f) => {
    friendSubtotals[f.id] = 0;
    friendItems[f.id] = [];
  });

  items.forEach((item) => {
    const assigned = assignments[item.id] || [];
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

  // Tip shares
  const tipAmount = tip ? (parseFloat(tip.amount) || 0) : 0;
  const tipMode = tip ? (tip.mode || 'equal') : 'equal';
  const tipShares = {};

  if (tipAmount > 0) {
    let allocatedTip = 0;
    if (tipMode === 'equal') {
      const perPerson = parseFloat((tipAmount / friends.length).toFixed(2));
      friends.forEach((f, idx) => {
        if (idx === friends.length - 1) {
          tipShares[f.id] = parseFloat((tipAmount - allocatedTip).toFixed(2));
        } else {
          tipShares[f.id] = perPerson;
          allocatedTip += perPerson;
        }
      });
    } else if (tipMode === 'proportional') {
      friends.forEach((f, idx) => {
        if (idx === friends.length - 1) {
          tipShares[f.id] = parseFloat((tipAmount - allocatedTip).toFixed(2));
        } else {
          const proportion = grandSubtotal > 0 ? friendSubtotals[f.id] / grandSubtotal : 1 / friends.length;
          const share = parseFloat((proportion * tipAmount).toFixed(2));
          tipShares[f.id] = share;
          allocatedTip += share;
        }
      });
    } else if (tipMode === 'progressive') {
      // tip share = person_subtotal^1.5 / sum(subtotals^1.5) × total_tip
      const powers = {};
      let sumPowers = 0;
      friends.forEach((f) => {
        const p = Math.pow(Math.max(friendSubtotals[f.id], 0), 1.5);
        powers[f.id] = p;
        sumPowers += p;
      });
      friends.forEach((f, idx) => {
        if (idx === friends.length - 1) {
          tipShares[f.id] = parseFloat((tipAmount - allocatedTip).toFixed(2));
        } else {
          const proportion = sumPowers > 0 ? powers[f.id] / sumPowers : 1 / friends.length;
          const share = parseFloat((proportion * tipAmount).toFixed(2));
          tipShares[f.id] = share;
          allocatedTip += share;
        }
      });
    }
  } else {
    friends.forEach((f) => { tipShares[f.id] = 0; });
  }

  return friends.map((f) => ({
    friend: f,
    itemSubtotal: parseFloat(friendSubtotals[f.id].toFixed(2)),
    gstShare: gstShares[f.id] || 0,
    tipShare: tipShares[f.id] || 0,
    total: parseFloat((friendSubtotals[f.id] + (gstShares[f.id] || 0) + (tipShares[f.id] || 0)).toFixed(2)),
    assignedItems: friendItems[f.id],
  }));
}
