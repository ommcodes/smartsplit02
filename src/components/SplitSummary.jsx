import { useState } from 'react';
import { calculateSplit } from '../utils/parseReceipt';
import { getFriendColorClass, getFriendDotColor } from './FriendManager';

function fmt(n) {
  return Number(n).toFixed(2);
}

export default function SplitSummary({ items, friends, assignments, gst, onBack, onReset }) {
  const [copied, setCopied] = useState(false);

  const splits = calculateSplit(items, friends, assignments, parseFloat(gst) || 0);
  const grandTotal = splits.reduce((s, sp) => s + sp.total, 0);
  const billTotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0) + (parseFloat(gst) || 0);
  const diff = Math.abs(grandTotal - billTotal);
  const isBalanced = diff < 0.02;

  const copyToClipboard = () => {
    const lines = ['🧾 SmartSplit — Bill Breakdown', ''];

    splits.forEach((sp) => {
      lines.push(`👤 ${sp.friend.name}`);
      sp.assignedItems.forEach((ai) => {
        lines.push(`   ${ai.name}: ₹${fmt(ai.share)}`);
      });
      lines.push(`   Items subtotal: ₹${fmt(sp.itemSubtotal)}`);
      lines.push(`   GST share: ₹${fmt(sp.gstShare)}`);
      lines.push(`   ➡ Total: ₹${fmt(sp.total)}`);
      lines.push('');
    });

    lines.push(`Grand Total: ₹${fmt(grandTotal)}`);

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Split Summary</h2>
          <p className="text-gray-500 text-sm mt-1">Here's how the bill breaks down.</p>
        </div>
        {isBalanced ? (
          <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
            ✓ Balanced
          </span>
        ) : (
          <span className="text-xs bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-full font-medium">
            ⚠ ₹{fmt(diff)} off
          </span>
        )}
      </div>

      {/* Per-person cards */}
      <div className="space-y-4 mb-6">
        {splits.map((sp, idx) => (
          <div key={sp.friend.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div
              className={`px-4 py-3 flex items-center justify-between border-b border-gray-100 ${
                idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getFriendColorClass(idx)}`}
                >
                  {sp.friend.name[0].toUpperCase()}
                </div>
                <span className="font-semibold text-gray-900">{sp.friend.name}</span>
              </div>
              <span className="text-green-600 font-bold text-lg">₹{fmt(sp.total)}</span>
            </div>

            {/* Items */}
            <div className="px-4 py-3">
              {sp.assignedItems.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No items assigned</p>
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
            </div>
          </div>
        ))}
      </div>

      {/* Grand Total */}
      <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-bold text-gray-900">Grand Total</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {friends.length} {friends.length === 1 ? 'person' : 'people'} · {items.length} items
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
              : 'bg-green-500 hover:bg-green-600 text-white'
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
