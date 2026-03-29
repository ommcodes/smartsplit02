import { useState } from 'react';
import { calculateSplit } from '../utils/parseReceipt';
import { getFriendColorClass, getFriendDotColor } from './FriendManager';

function fmt(n) {
  return Number(n).toFixed(2);
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
    `Total: ₹${fmt(sp.total)}`,
    '',
    'Split by SmartSplit ✨',
  ];
  return lines.join('\n');
}

/** Build a combined WhatsApp message for all people */
function buildFullSummaryMessage(splits, grandTotal) {
  const lines = ['🧾 SmartSplit — Full Bill Breakdown', ''];
  splits.forEach((sp) => {
    lines.push(`👤 ${sp.friend.name}`);
    sp.assignedItems.forEach((ai) => {
      lines.push(`   • ${ai.name}: ₹${fmt(ai.share)}`);
    });
    lines.push(`   Items: ₹${fmt(sp.itemSubtotal)}  GST: ₹${fmt(sp.gstShare)}`);
    lines.push(`   ➡ Total: ₹${fmt(sp.total)}`);
    lines.push('');
  });
  lines.push(`Grand Total: ₹${fmt(grandTotal)}`);
  lines.push('');
  lines.push('Split by SmartSplit ✨');
  return lines.join('\n');
}

function openWhatsApp(text) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

function buildUpiLink(friend, amount) {
  return `upi://pay?pa=${encodeURIComponent(friend.upiId)}&pn=${encodeURIComponent(friend.name)}&am=${amount.toFixed(2)}&cu=INR&tn=SmartSplit`;
}

/** UPI button row — shows Pay button if UPI ID set, otherwise inline input */
function UpiSection({ friend, amount, onUpiSaved }) {
  const [editMode, setEditMode] = useState(!friend.upiId);
  const [upiValue, setUpiValue] = useState(friend.upiId || '');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    const trimmed = upiValue.trim();
    if (trimmed) {
      onUpiSaved(trimmed);
      setEditMode(false);
    }
  };

  const handleCopyLink = () => {
    if (!friend.upiId) return;
    navigator.clipboard.writeText(buildUpiLink(friend, amount)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (editMode || !friend.upiId) {
    return (
      <div className="flex gap-1.5 mt-2">
        <input
          type="text"
          value={upiValue}
          onChange={(e) => setUpiValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="UPI ID (e.g. name@upi)"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          style={{ fontSize: '16px' }}
          inputMode="email"
          autoComplete="off"
        />
        <button
          onClick={handleSave}
          disabled={!upiValue.trim()}
          className="px-3 py-2 bg-green-500 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors min-h-[40px]"
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <a
        href={buildUpiLink(friend, amount)}
        className="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-semibold text-center transition-colors min-h-[40px] flex items-center justify-center gap-1"
      >
        💸 Pay via UPI
      </a>
      <button
        onClick={handleCopyLink}
        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[40px] ${
          copied
            ? 'bg-green-100 text-green-700 border-green-300'
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
        }`}
      >
        {copied ? '✓ Copied!' : '📋 Copy UPI Link'}
      </button>
      <button
        onClick={() => setEditMode(true)}
        className="px-2 py-2 text-gray-400 hover:text-gray-600 text-xs border border-gray-200 rounded-lg transition-colors"
        title="Edit UPI ID"
      >
        ✎
      </button>
    </div>
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
        <svg
          className={`w-3 h-3 transition-transform ${open ? '' : '-rotate-90'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
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
                <span>GST share</span>
                <span>₹{fmt(sp.gstShare)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-gray-700 border-t border-gray-200 mt-1 pt-1">
                <span>Subtotal</span>
                <span>₹{fmt(sp.total)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SplitSummary({ items, receipts, friends, assignments, gst, onBack, onReset }) {
  const [copied, setCopied] = useState(false);
  const [upiIds, setUpiIds] = useState(() => {
    // Pre-populate from friends' stored UPI IDs
    const map = {};
    friends.forEach((f) => { map[f.id] = f.upiId || ''; });
    return map;
  });

  const splits = calculateSplit(items, friends, assignments, parseFloat(gst) || 0);
  const grandTotal = splits.reduce((s, sp) => s + sp.total, 0);
  const billTotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) + (parseFloat(gst) || 0);
  const diff = Math.abs(grandTotal - billTotal);
  const isBalanced = diff < 0.02;

  // Per-receipt splits (used for breakdown when multiple receipts)
  const receiptSplits =
    receipts && receipts.length > 1
      ? receipts.map((receipt) => ({
          receipt,
          splits: calculateSplit(
            receipt.items,
            friends,
            assignments,
            parseFloat(receipt.gst) || 0
          ),
        }))
      : null;

  // Merged friend data (stored UPI + any edits in this view)
  const getFriend = (sp) => ({
    ...sp.friend,
    upiId: upiIds[sp.friend.id] ?? sp.friend.upiId ?? '',
  });

  const copyToClipboard = () => {
    const text = buildFullSummaryMessage(splits, grandTotal);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareFullSummary = () => {
    openWhatsApp(buildFullSummaryMessage(splits, grandTotal));
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
        onClick={shareFullSummary}
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
          const friend = getFriend(sp);

          return (
            <div key={sp.friend.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Card header */}
              <div
                className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getFriendColorClass(idx)}`}
                  >
                    {sp.friend.name[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900">{sp.friend.name}</span>
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
                  <div className="flex justify-between text-sm font-semibold text-gray-800 pt-1">
                    <span>Total</span>
                    <span className="text-green-600">₹{fmt(sp.total)}</span>
                  </div>
                </div>

                {/* Per-receipt breakdown (collapsible, only when multiple receipts) */}
                <ReceiptBreakdown receiptSplits={receiptSplits} friendId={sp.friend.id} />

                {/* Share / Pay buttons */}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openWhatsApp(buildWhatsAppMessage(sp))}
                    className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </button>
                </div>

                {/* UPI section */}
                <UpiSection
                  friend={friend}
                  amount={sp.total}
                  onUpiSaved={(upiId) =>
                    setUpiIds((prev) => ({ ...prev, [sp.friend.id]: upiId }))
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-900">Grand Total</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {friends.length} {friends.length === 1 ? 'person' : 'people'} · {items.length} items
              {receipts && receipts.length > 1 && ` · ${receipts.length} receipts`}
            </p>
          </div>
          <span className="text-2xl font-bold text-green-600">₹{fmt(grandTotal)}</span>
        </div>
      </div>

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
