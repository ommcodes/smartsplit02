import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { calculateSplit } from '../utils/parseReceipt';
import { getFriendColorClass, getFriendDotColor } from './FriendManager';

function fmt(n) {
  return Number(n).toFixed(2);
}

function openWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function buildUpiIntent({ upiId, name, amount, tn = 'SmartSplit+Bill+Share' }) {
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=${tn}`;
}

function buildGPayLink({ upiId, name, amount }) {
  return `tez://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR&tn=SmartSplit`;
}

function buildPhonePeLink({ upiId, name, amount }) {
  return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

function buildPaytmLink({ upiId, name, amount }) {
  return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount.toFixed(2)}&cu=INR`;
}

/** Build the WhatsApp message for a single person's split */
function buildWhatsAppMessage(sp) {
  const lines = [
    'SmartSplit Summary 🧾',
    `Hey ${sp.friend.name}, here's your share:`,
    '',
    'Items:',
    ...sp.assignedItems.map((ai) => `  • ${ai.name}: ₹${fmt(ai.share)}`),
    '',
    `Subtotal: ₹${fmt(sp.itemSubtotal)}`,
    `GST Share: ₹${fmt(sp.gstShare)}`,
  ];
  if (sp.tipShare > 0) lines.push(`Tip Share: ₹${fmt(sp.tipShare)}`);
  lines.push(`Total: ₹${fmt(sp.total)}`, '', 'Split by SmartSplit ✨');
  return lines.join('\n');
}

/** Build a combined WhatsApp message for all people */
function buildFullSummaryMessage(splits, grandTotal) {
  const lines = ['🧾 SmartSplit — Full Bill Breakdown', ''];
  splits.forEach((sp) => {
    lines.push(`👤 ${sp.friend.name}`);
    sp.assignedItems.forEach((ai) => lines.push(`   • ${ai.name}: ₹${fmt(ai.share)}`));
    lines.push(`   Items: ₹${fmt(sp.itemSubtotal)}  GST: ₹${fmt(sp.gstShare)}`);
    if (sp.tipShare > 0) lines.push(`   Tip: ₹${fmt(sp.tipShare)}`);
    lines.push(`   ➡ Total: ₹${fmt(sp.total)}`, '');
  });
  lines.push(`Grand Total: ₹${fmt(grandTotal)}`, '', 'Split by SmartSplit ✨');
  return lines.join('\n');
}

/** 4 UPI app buttons + generic + QR code */
function UpiPayButtons({ upiId, payeeName, amount, label }) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!upiId) return null;

  const params = { upiId, name: payeeName, amount };
  const genericLink = buildUpiIntent({ ...params });

  const handleCopy = () => {
    navigator.clipboard.writeText(genericLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mt-2 space-y-2">
      {label && <p className="text-xs text-gray-500">{label}</p>}
      {/* App buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <a
          href={buildGPayLink(params)}
          className="py-2.5 text-center text-xs font-bold rounded-xl border bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
        >
          GPay
        </a>
        <a
          href={buildPhonePeLink(params)}
          className="py-2.5 text-center text-xs font-bold rounded-xl border bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors"
        >
          PhonePe
        </a>
        <a
          href={buildPaytmLink(params)}
          className="py-2.5 text-center text-xs font-bold rounded-xl border bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100 transition-colors"
        >
          Paytm
        </a>
        <a
          href={genericLink}
          className="py-2.5 text-center text-xs font-bold rounded-xl border bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 transition-colors"
        >
          UPI
        </a>
      </div>
      {/* Copy + QR toggle */}
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
            copied ? 'bg-green-100 text-green-700 border-green-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy UPI Link'}
        </button>
        <button
          onClick={() => setShowQR((o) => !o)}
          className="flex-1 py-1.5 text-xs rounded-lg border bg-white text-gray-500 border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {showQR ? 'Hide QR' : '📱 QR Code'}
        </button>
      </div>
      {/* QR Code */}
      {showQR && (
        <div className="flex justify-center py-3 bg-white rounded-xl border border-gray-200">
          <QRCodeSVG value={genericLink} size={150} level="M" />
        </div>
      )}
    </div>
  );
}

/** UPI section shown inside each person's summary card */
function UpiSection({ friend, amount, billPayer, billPayerUpiId, onUpiSaved, onBillPayerUpiSaved }) {
  const [editMode, setEditMode] = useState(false);
  const [upiValue, setUpiValue] = useState('');

  const isBillPayer = friend.id === billPayer?.id;

  if (isBillPayer) {
    // Bill payer: show their UPI ID for others to pay them
    return (
      <div className="mt-3">
        <p className="text-xs text-gray-500 mb-1.5">Your UPI ID (for payment collection)</p>
        {billPayerUpiId && !editMode ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 flex-1 truncate bg-gray-50 rounded-lg px-2 py-1.5 border border-gray-100">
              {billPayerUpiId}
            </span>
            <button
              onClick={() => { setEditMode(true); setUpiValue(billPayerUpiId); }}
              className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 min-h-[32px]"
            >
              ✎
            </button>
          </div>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="text"
              value={upiValue}
              onChange={(e) => setUpiValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && upiValue.trim()) {
                  onBillPayerUpiSaved(upiValue.trim());
                  setEditMode(false);
                }
              }}
              placeholder="Your UPI ID"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              style={{ fontSize: '16px' }}
              autoComplete="off"
            />
            <button
              onClick={() => {
                if (upiValue.trim()) { onBillPayerUpiSaved(upiValue.trim()); setEditMode(false); }
              }}
              disabled={!upiValue.trim()}
              className="px-3 py-2 bg-green-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-medium min-h-[40px]"
            >
              Save
            </button>
          </div>
        )}
        {billPayerUpiId && !editMode && (
          <p className="text-xs text-gray-400 mt-1">Share this so others can pay you back.</p>
        )}
      </div>
    );
  }

  // Non-payer: show payment buttons to pay the bill payer
  if (!billPayerUpiId) {
    return (
      <div className="mt-3 text-xs text-gray-400 italic">
        Add {billPayer?.name || 'bill payer'}'s UPI ID to enable direct payment buttons.
      </div>
    );
  }

  return (
    <UpiPayButtons
      upiId={billPayerUpiId}
      payeeName={billPayer?.name || ''}
      amount={amount}
      label={`Pay ${billPayer?.name}`}
    />
  );
}

/** Collapsible per-receipt breakdown within a person's card */
function ReceiptBreakdown({ receiptSplits, friendId }) {
  const [open, setOpen] = useState(false);
  if (!receiptSplits || receiptSplits.length < 2) return null;

  const perReceipt = receiptSplits
    .map(({ receipt, splits }) => ({ receipt, sp: splits.find((s) => s.friend.id === friendId) }))
    .filter((x) => x.sp && (x.sp.itemSubtotal > 0 || x.sp.gstShare > 0));

  if (perReceipt.length < 2) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
      >
        <svg className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {open ? 'Hide' : 'Show'} per-receipt breakdown
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {perReceipt.map(({ receipt, sp }) => (
            <div key={receipt.id} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">{receipt.name}</p>
              {sp.assignedItems.map((ai, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[65%]">{ai.name}</span>
                  <span>₹{fmt(ai.share)}</span>
                </div>
              ))}
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>GST share</span><span>₹{fmt(sp.gstShare)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 border-t border-gray-200 mt-1 pt-1">
                <span>Subtotal</span><span>₹{fmt(sp.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Greedy settlement algorithm */
function computeSettlements(splits, billPayerId) {
  const billPayer = splits.find((sp) => sp.friend.id === billPayerId);
  if (!billPayer) return [];

  // Build net balances: positive = owed money, negative = owes money
  const balances = {};
  splits.forEach((sp) => {
    if (sp.friend.id === billPayerId) {
      balances[sp.friend.id] = splits
        .filter((s) => s.friend.id !== billPayerId)
        .reduce((sum, s) => sum + s.total, 0);
    } else {
      balances[sp.friend.id] = -sp.total;
    }
  });

  const result = [];
  const bal = { ...balances };

  for (let iter = 0; iter < 200; iter++) {
    let maxCreditorId = null, maxDebtorId = null;
    let maxCredit = 0, maxDebt = 0;

    Object.entries(bal).forEach(([id, b]) => {
      if (b > 0.005 && b > maxCredit) { maxCredit = b; maxCreditorId = id; }
      if (b < -0.005 && Math.abs(b) > maxDebt) { maxDebt = Math.abs(b); maxDebtorId = id; }
    });

    if (!maxCreditorId || !maxDebtorId) break;

    const amount = Math.min(maxCredit, maxDebt);
    result.push({
      from: maxDebtorId,
      to: maxCreditorId,
      amount: parseFloat(amount.toFixed(2)),
    });
    bal[maxCreditorId] = parseFloat((bal[maxCreditorId] - amount).toFixed(10));
    bal[maxDebtorId] = parseFloat((bal[maxDebtorId] + amount).toFixed(10));
  }

  return result;
}

function getSettledKey(fromName, toName) {
  return `smartsplit_settled_${fromName}_${toName}`;
}

/** Settlement Optimizer section */
function SettlementOptimizer({ splits, friends, billPayerId, upiIds }) {
  const [settledMap, setSettledMap] = useState(() => {
    const map = {};
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('smartsplit_settled_'))
        .forEach((k) => { map[k] = localStorage.getItem(k) === 'true'; });
    } catch {}
    return map;
  });

  const billPayer = friends.find((f) => f.id === billPayerId) || friends[0];
  const effectiveBillPayerId = billPayer?.id;

  const settlements = useMemo(
    () => computeSettlements(splits, effectiveBillPayerId),
    [splits, effectiveBillPayerId]
  );

  const toggleSettled = (key) => {
    setSettledMap((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(key, String(next[key])); } catch {}
      return next;
    });
  };

  if (!billPayer || settlements.length === 0) return null;

  const originalCount = friends.length - 1; // everyone pays bill payer directly
  const optimizedCount = settlements.length;
  const saved = originalCount - optimizedCount;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-bold text-gray-900">Settle Up</h3>
        <span className="text-xs bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-medium">
          Minimum Payments
        </span>
      </div>

      {/* Comparison text */}
      <div className="text-xs text-gray-500 mb-3">
        {saved > 0 ? (
          <span className="text-green-600 font-medium">
            Optimized from {originalCount} → {optimizedCount} transactions — saved {saved} payment{saved !== 1 ? 's' : ''}!
          </span>
        ) : (
          <span>
            {optimizedCount} transaction{optimizedCount !== 1 ? 's' : ''} needed — already optimal!
          </span>
        )}
      </div>

      <div className="space-y-3">
        {settlements.map((s, i) => {
          const fromFriend = friends.find((f) => f.id === s.from);
          const toFriend = friends.find((f) => f.id === s.to);
          if (!fromFriend || !toFriend) return null;

          const toUpiId = upiIds[toFriend.id] || toFriend.upiId || '';
          const key = getSettledKey(fromFriend.name, toFriend.name);
          const isSettled = !!settledMap[key];

          const waMsg = `Hey ${fromFriend.name}, please pay ₹${fmt(s.amount)} to ${toFriend.name}.\n\n${toUpiId ? `UPI: ${toUpiId}\n\n` : ''}Sent via SmartSplit ✨`;

          return (
            <div
              key={i}
              className={`bg-white rounded-2xl border p-4 transition-all ${
                isSettled ? 'border-green-200 bg-green-50/30 opacity-70' : 'border-gray-200'
              }`}
            >
              {/* Arrow visualization */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800 truncate">{fromFriend.name}</span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="text-sm font-bold text-green-600 shrink-0">₹{fmt(s.amount)}</span>
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span className="text-sm font-semibold text-gray-800 truncate">{toFriend.name}</span>
                </div>
                {/* Mark as paid */}
                <button
                  onClick={() => toggleSettled(key)}
                  className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isSettled
                      ? 'bg-green-100 text-green-700 border-green-300'
                      : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {isSettled ? '✓ Paid' : 'Mark paid'}
                </button>
              </div>

              {/* UPI buttons (using toFriend's UPI = payee) */}
              {toUpiId ? (
                <UpiPayButtons
                  upiId={toUpiId}
                  payeeName={toFriend.name}
                  amount={s.amount}
                  label={`Pay ${toFriend.name}`}
                />
              ) : (
                <p className="text-xs text-gray-400 italic">
                  Add {toFriend.name}'s UPI ID to enable payment buttons.
                </p>
              )}

              {/* WhatsApp */}
              <button
                onClick={() => openWhatsApp(waMsg)}
                className="mt-2 w-full py-2 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold rounded-xl border border-green-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share on WhatsApp
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SplitSummary({ items, receipts, friends, assignments, gst, tip, billPayerId, onBack, onReset }) {
  const [copied, setCopied] = useState(false);
  const [upiIds, setUpiIds] = useState(() => {
    const map = {};
    friends.forEach((f) => { map[f.id] = f.upiId || ''; });
    return map;
  });

  // Compute effective tip amount
  const itemsSubtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const effectiveTipAmount = tip
    ? (tip.isPercent
      ? (parseFloat(tip.amount) || 0) / 100 * itemsSubtotal
      : parseFloat(tip.amount) || 0)
    : 0;
  const effectiveTip = effectiveTipAmount > 0
    ? { amount: effectiveTipAmount, mode: tip?.mode || 'equal' }
    : null;

  const splits = calculateSplit(items, friends, assignments, parseFloat(gst) || 0, effectiveTip);
  const grandTotal = splits.reduce((s, sp) => s + sp.total, 0);
  const billTotal = itemsSubtotal + (parseFloat(gst) || 0) + effectiveTipAmount;
  const diff = Math.abs(grandTotal - billTotal);
  const isBalanced = diff < 0.02;

  // Per-receipt splits (no tip per receipt)
  const receiptSplits =
    receipts && receipts.length > 1
      ? receipts.map((receipt) => ({
          receipt,
          splits: calculateSplit(receipt.items, friends, assignments, parseFloat(receipt.gst) || 0, null),
        }))
      : null;

  // Identify bill payer
  const billPayer = friends.find((f) => f.id === billPayerId) || friends[0];
  const billPayerUpiId = upiIds[billPayer?.id] || '';

  const getFriendWithUpi = (sp) => ({
    ...sp.friend,
    upiId: upiIds[sp.friend.id] ?? sp.friend.upiId ?? '',
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(buildFullSummaryMessage(splits, grandTotal)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Split Summary</h2>
          <p className="text-gray-500 text-sm mt-1">Here's how the bill breaks down.</p>
        </div>
        {isBalanced ? (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium shrink-0">
            ✓ Balanced
          </span>
        ) : (
          <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium shrink-0">
            ⚠ ₹{fmt(diff)} off
          </span>
        )}
      </div>

      {/* Share Full Summary */}
      <button
        onClick={() => openWhatsApp(buildFullSummaryMessage(splits, grandTotal))}
        className="w-full py-3 mb-5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-sm"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Share Full Summary via WhatsApp
      </button>

      {/* Per-person cards */}
      <div className="space-y-4 mb-6">
        {splits.map((sp, idx) => {
          const friend = getFriendWithUpi(sp);
          const isBP = friend.id === billPayer?.id;

          return (
            <div key={sp.friend.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getFriendColorClass(idx)}`}>
                    {sp.friend.name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{sp.friend.name}</span>
                  {isBP && (
                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      paid bill
                    </span>
                  )}
                </div>
                <span className="text-green-600 font-bold text-lg">₹{fmt(sp.total)}</span>
              </div>

              {/* Items breakdown */}
              <div className="px-4 py-3">
                {sp.assignedItems.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No items assigned to this person</p>
                ) : (
                  <div className="space-y-1.5 mb-3">
                    {sp.assignedItems.map((ai, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate max-w-[70%]">{ai.name}</span>
                        <span className="text-sm text-gray-700 font-medium">₹{fmt(ai.share)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Items subtotal</span>
                    <span>₹{fmt(sp.itemSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>GST share</span>
                    <span>₹{fmt(sp.gstShare)}</span>
                  </div>
                  {sp.tipShare > 0 && (
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Tip share</span>
                      <span>₹{fmt(sp.tipShare)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1">
                    <span>Total</span>
                    <span className="text-green-600">₹{fmt(sp.total)}</span>
                  </div>
                </div>

                {/* Per-receipt breakdown (collapsible) */}
                <ReceiptBreakdown receiptSplits={receiptSplits} friendId={sp.friend.id} />

                {/* WhatsApp share */}
                <div className="mt-3">
                  <button
                    onClick={() => openWhatsApp(buildWhatsAppMessage(sp))}
                    className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Share via WhatsApp
                  </button>
                </div>

                {/* UPI section */}
                <UpiSection
                  friend={friend}
                  amount={sp.total}
                  billPayer={billPayer}
                  billPayerUpiId={billPayerUpiId}
                  onUpiSaved={(upiId) => setUpiIds((prev) => ({ ...prev, [sp.friend.id]: upiId }))}
                  onBillPayerUpiSaved={(upiId) => {
                    setUpiIds((prev) => ({ ...prev, [billPayer.id]: upiId }));
                    try { localStorage.setItem(`smartsplit_upi_${billPayer.name.toLowerCase()}`, upiId); } catch {}
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="font-bold text-gray-900">Grand Total</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {friends.length} {friends.length === 1 ? 'person' : 'people'} · {items.length} items
              {receipts && receipts.length > 1 && ` · ${receipts.length} receipts`}
            </p>
          </div>
          <span className="text-2xl font-bold text-green-600">₹{fmt(grandTotal)}</span>
        </div>
        {effectiveTipAmount > 0 && (
          <div className="text-xs text-gray-500 space-y-0.5 pt-2 border-t border-green-200">
            <div className="flex justify-between">
              <span>Items + GST</span>
              <span>₹{fmt(itemsSubtotal + (parseFloat(gst) || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span>Tip</span>
              <span>₹{fmt(effectiveTipAmount)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Settlement Optimizer */}
      <SettlementOptimizer
        splits={splits}
        friends={friends}
        billPayerId={billPayer?.id || ''}
        upiIds={upiIds}
      />

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={copyToClipboard}
          className={`w-full py-3 font-semibold rounded-xl transition-all active:scale-95 ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {copied ? '✓ Copied!' : '📋 Copy Summary'}
        </button>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            ← Back
          </button>
          <button
            onClick={onReset}
            className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
          >
            🔄 New Split
          </button>
        </div>
      </div>
    </div>
  );
}
