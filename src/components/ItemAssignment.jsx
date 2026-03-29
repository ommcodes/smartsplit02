import { useEffect, useState } from 'react';
import { getFriendColorClass, getFriendDotColor } from './FriendManager';

function fmt(n) {
  return Number(n).toFixed(2);
}

/** Compute per-person tip preview without importing calculateSplit */
function getTipPreview(friends, items, assignments, tipAmount, tipMode) {
  const subtotals = {};
  friends.forEach((f) => { subtotals[f.id] = 0; });
  items.forEach((item) => {
    const assigned = assignments[item.id] || [];
    const payers = assigned.length > 0 ? assigned : friends.map((f) => f.id);
    const share = item.price / payers.length;
    payers.forEach((fid) => { if (subtotals[fid] !== undefined) subtotals[fid] += share; });
  });

  const grandTotal = Object.values(subtotals).reduce((s, v) => s + v, 0);
  const shares = {};

  if (tipMode === 'equal') {
    friends.forEach((f) => { shares[f.id] = tipAmount / friends.length; });
  } else if (tipMode === 'proportional') {
    friends.forEach((f) => {
      shares[f.id] = grandTotal > 0
        ? (subtotals[f.id] / grandTotal) * tipAmount
        : tipAmount / friends.length;
    });
  } else if (tipMode === 'progressive') {
    const powers = {};
    let sumPowers = 0;
    friends.forEach((f) => {
      const p = Math.pow(Math.max(subtotals[f.id], 0), 1.5);
      powers[f.id] = p;
      sumPowers += p;
    });
    friends.forEach((f) => {
      shares[f.id] = sumPowers > 0
        ? (powers[f.id] / sumPowers) * tipAmount
        : tipAmount / friends.length;
    });
  }

  return friends.map((f) => ({ friend: f, tipShare: parseFloat((shares[f.id] || 0).toFixed(2)) }));
}

const TIP_MODES = [
  {
    id: 'equal',
    label: 'Equal tip',
    desc: 'Split tip equally — fair when everyone had similar items',
  },
  {
    id: 'proportional',
    label: 'Proportional tip',
    desc: 'Proportional — you tip based on what you ordered',
  },
  {
    id: 'progressive',
    label: 'Big spender tips more',
    desc: 'Progressive — big spenders contribute more to the tip',
  },
];

function TipCalculator({ tip, setTip, friends, items, assignments }) {
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const effectiveTipAmount = tip.isPercent
    ? (parseFloat(tip.amount) || 0) / 100 * subtotal
    : parseFloat(tip.amount) || 0;

  const preview = effectiveTipAmount > 0
    ? getTipPreview(friends, items, assignments, effectiveTipAmount, tip.mode)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">Tip</h3>
        {effectiveTipAmount > 0 && (
          <span className="text-xs text-green-600 font-medium">₹{fmt(effectiveTipAmount)} total</span>
        )}
      </div>

      {/* Amount input + ₹/% toggle */}
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          value={tip.amount}
          onChange={(e) => setTip((prev) => ({ ...prev, amount: e.target.value }))}
          placeholder="0"
          min="0"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          style={{ fontSize: '16px' }}
          inputMode="decimal"
        />
        <button
          onClick={() => setTip((prev) => ({ ...prev, isPercent: !prev.isPercent, amount: '' }))}
          className={`px-4 py-2 border rounded-xl text-sm font-semibold transition-colors min-h-[44px] ${
            tip.isPercent
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {tip.isPercent ? '%' : '₹'}
        </button>
      </div>

      {/* Quick % buttons */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[5, 10, 15, 20].map((pct) => (
          <button
            key={pct}
            onClick={() => setTip((prev) => ({ ...prev, amount: String(pct), isPercent: true }))}
            className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
              tip.isPercent && Number(tip.amount) === pct
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Fairness modes */}
      <div className="space-y-2 mb-3">
        {TIP_MODES.map((mode) => (
          <label
            key={mode.id}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              tip.mode === mode.id
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="tipMode"
              value={mode.id}
              checked={tip.mode === mode.id}
              onChange={() => setTip((prev) => ({ ...prev, mode: mode.id }))}
              className="mt-0.5 shrink-0"
            />
            <div>
              <p className="text-xs font-semibold text-gray-800">{mode.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{mode.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Live preview */}
      {preview && (
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-2">Tip per person</p>
          <div className="space-y-1">
            {preview.map(({ friend, tipShare }) => (
              <div key={friend.id} className="flex justify-between text-xs">
                <span className="text-gray-600">{friend.name}</span>
                <span className="font-medium text-gray-800">₹{fmt(tipShare)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!effectiveTipAmount && tip.amount !== '' && Number(tip.amount) === 0 && (
        <p className="text-xs text-gray-400 text-center mt-1">No tip added</p>
      )}
    </div>
  );
}

export default function ItemAssignment({ items, friends, assignments, setAssignments, tip, setTip, onNext, onBack }) {
  const [assignmentMode, setAssignmentMode] = useState(() => {
    try { return localStorage.getItem('smartsplit_assignment_mode') || 'had'; }
    catch { return 'had'; }
  });

  // When in 'skipped' mode, pre-fill all unassigned items with all friends
  useEffect(() => {
    if (assignmentMode === 'skipped') {
      setAssignments((prev) => {
        const updated = { ...prev };
        let changed = false;
        items.forEach((item) => {
          if (!updated[item.id] || updated[item.id].length === 0) {
            updated[item.id] = friends.map((f) => f.id);
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [assignmentMode, items, friends, setAssignments]);

  const switchMode = (mode) => {
    setAssignmentMode(mode);
    try { localStorage.setItem('smartsplit_assignment_mode', mode); } catch {}
    if (mode === 'skipped') {
      // Pre-assign all items to all friends immediately
      const newAssignments = {};
      items.forEach((item) => {
        newAssignments[item.id] = friends.map((f) => f.id);
      });
      setAssignments((prev) => ({ ...prev, ...newAssignments }));
    }
  };

  const toggleAssignment = (itemId, friendId) => {
    setAssignments((prev) => {
      const current = prev[itemId] || [];
      const updated = current.includes(friendId)
        ? current.filter((id) => id !== friendId)
        : [...current, friendId];
      return { ...prev, [itemId]: updated };
    });
  };

  const assignAll = (itemId) => {
    setAssignments((prev) => ({ ...prev, [itemId]: friends.map((f) => f.id) }));
  };

  const clearAll = (itemId) => {
    setAssignments((prev) => ({ ...prev, [itemId]: [] }));
  };

  const assignAllToEveryone = () => {
    const newAssignments = {};
    items.forEach((item) => {
      newAssignments[item.id] = friends.map((f) => f.id);
    });
    setAssignments(newAssignments);
  };

  const unassignedItems = items.filter((item) => !(assignments[item.id] || []).length);
  const canProceed = items.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assign Items</h2>
          <p className="text-gray-500 text-sm mt-1">
            {assignmentMode === 'had'
              ? 'Tap names to assign. Unassigned items split equally.'
              : 'Tap a name to mark them as skipped. Everyone else splits the item.'}
          </p>
        </div>
        <button
          onClick={assignAllToEveryone}
          className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
        >
          Assign all equally
        </button>
      </div>

      {/* Tip Calculator */}
      <TipCalculator
        tip={tip}
        setTip={setTip}
        friends={friends}
        items={items}
        assignments={assignments}
      />

      {/* Assignment Mode Toggle */}
      <div className="bg-white rounded-2xl border border-gray-200 p-3 mb-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Assignment Mode</p>
        <div className="flex gap-2">
          <button
            onClick={() => switchMode('had')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
              assignmentMode === 'had'
                ? 'bg-green-100 border-green-300 text-green-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            ✓ I had this
          </button>
          <button
            onClick={() => switchMode('skipped')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl border transition-colors ${
              assignmentMode === 'skipped'
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            ✗ I didn't have this
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {friends.map((f, idx) => (
          <div
            key={f.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${getFriendColorClass(idx)}`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${getFriendDotColor(idx)}`} />
            {f.name}
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => {
          const assigned = assignments[item.id] || [];
          const splittingCount = assigned.length > 0 ? assigned.length : friends.length;
          const share = splittingCount > 0 ? item.price / splittingCount : 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 transition-all ${
                assigned.length === 0 && assignmentMode === 'had'
                  ? 'border-blue-200 bg-blue-50/20'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight">{item.name}</p>
                  <p className="text-green-600 font-semibold text-sm mt-0.5">₹{fmt(item.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  {assignmentMode === 'skipped' ? (
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">{splittingCount}</span>
                      <span> of {friends.length} splitting</span>
                      {splittingCount > 0 && (
                        <div className="mt-0.5">
                          <span className="font-semibold text-gray-700">₹{fmt(share)}</span> each
                        </div>
                      )}
                    </div>
                  ) : (
                    assigned.length > 0 ? (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">₹{fmt(share)}</span> each
                      </div>
                    ) : (
                      <span className="text-xs text-blue-500 font-medium">everyone</span>
                    )
                  )}
                </div>
              </div>

              {/* Friend toggle buttons */}
              <div className="flex flex-wrap gap-2">
                {friends.map((friend, idx) => {
                  const isAssigned = assigned.includes(friend.id);
                  // Visual logic depends on mode
                  const isActiveHad = assignmentMode === 'had' && isAssigned;
                  const isSkipped = assignmentMode === 'skipped' && !isAssigned;

                  const buttonClass = isActiveHad
                    ? getFriendColorClass(idx) + ' shadow-sm'
                    : isSkipped
                    ? 'bg-red-100 text-red-600 border-red-300 shadow-sm'
                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300';

                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleAssignment(item.id, friend.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium transition-all active:scale-95 min-h-[44px] ${buttonClass}`}
                    >
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border-2 transition-colors`}
                        style={{ minWidth: '20px', minHeight: '20px' }}
                      >
                        {isActiveHad && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isSkipped && (
                          <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                      {friend.name}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => assignAll(item.id)}
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors py-1"
                >
                  {assignmentMode === 'skipped' ? 'Reset (all had it)' : 'Select all'}
                </button>
                {assigned.length > 0 && assignmentMode === 'had' && (
                  <button
                    onClick={() => clearAll(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
                  >
                    Clear
                  </button>
                )}
                {assignmentMode === 'skipped' && assigned.length < friends.length && (
                  <button
                    onClick={() => clearAll(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors py-1"
                  >
                    Mark all skipped
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unassignedItems.length > 0 && assignmentMode === 'had' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm">
          ℹ️ {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} will be split equally among everyone
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all active:scale-95"
        >
          View Summary →
        </button>
      </div>
    </div>
  );
}
