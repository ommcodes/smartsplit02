import { useState, useRef, useEffect } from 'react';

const COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
];

const DOT_COLORS = [
  'bg-blue-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-orange-400',
  'bg-teal-400',
  'bg-yellow-400',
  'bg-red-400',
  'bg-indigo-400',
];

const UPI_HANDLES = [
  '@okaxis', '@oksbi', '@okhdfcbank', '@okicici',
  '@ybl', '@ibl', '@axl', '@paytm', '@apl',
  '@jupiteraxis', '@fbl', '@ratn', '@cboi', '@upi',
];

export function getFriendColorClass(index) {
  return COLORS[index % COLORS.length];
}

export function getFriendDotColor(index) {
  return DOT_COLORS[index % DOT_COLORS.length];
}

function getStoredUpi(name) {
  try { return localStorage.getItem(`smartsplit_upi_${name.toLowerCase()}`) || ''; }
  catch { return ''; }
}

function storeUpi(name, upiId) {
  try {
    if (upiId) localStorage.setItem(`smartsplit_upi_${name.toLowerCase()}`, upiId);
  } catch {}
}

/** Enhanced UPI editor with autocomplete and mobile number support */
function UpiEditor({ friend, onSave }) {
  const [inputMode, setInputMode] = useState('upi');
  const [value, setValue] = useState(friend.upiId || '');
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    if (inputMode === 'upi') {
      const atIdx = v.lastIndexOf('@');
      if (atIdx >= 0) {
        const fragment = v.slice(atIdx); // e.g. "@ok"
        const filtered = UPI_HANDLES.filter((h) => h.startsWith(fragment) && h !== fragment);
        setSuggestions(filtered);
      } else {
        setSuggestions([]);
      }
    }
  };

  const selectSuggestion = (handle) => {
    const atIdx = value.lastIndexOf('@');
    const prefix = atIdx >= 0 ? value.slice(0, atIdx) : value;
    setValue(prefix + handle);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const isValidMobile = inputMode === 'mobile' && /^[6-9]\d{9}$/.test(value);
  const generatedUpiId = isValidMobile ? `${value}@upi` : null;
  const canSave = inputMode === 'mobile' ? isValidMobile : !!value.trim();

  const handleSave = () => {
    const upiId = inputMode === 'mobile' ? generatedUpiId : value.trim();
    if (upiId) {
      onSave(upiId);
      setSuggestions([]);
    }
  };

  const switchMode = (mode) => {
    setInputMode(mode);
    setValue('');
    setSuggestions([]);
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => switchMode('upi')}
          className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
            inputMode === 'upi' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          UPI ID
        </button>
        <button
          onClick={() => switchMode('mobile')}
          className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
            inputMode === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Mobile No.
        </button>
      </div>

      {/* Input + suggestions */}
      <div className="relative">
        <div className="flex gap-1.5">
          <input
            ref={inputRef}
            type={inputMode === 'mobile' ? 'tel' : 'text'}
            value={value}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setSuggestions([]);
            }}
            placeholder={inputMode === 'upi' ? 'name@upi or type @ok...' : '10-digit mobile number'}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            style={{ fontSize: '16px' }}
            autoComplete="off"
            inputMode={inputMode === 'mobile' ? 'numeric' : 'email'}
            maxLength={inputMode === 'mobile' ? 10 : undefined}
          />
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 transition-colors min-h-[36px]"
          >
            Save
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-44 overflow-y-auto">
            {suggestions.map((h) => (
              <button
                key={h}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(h); }}
                className="w-full text-left px-3 py-2.5 text-xs text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors border-b border-gray-50 last:border-0"
              >
                <span className="font-medium">{h}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mobile mode: validation hint + generated UPI */}
      {inputMode === 'mobile' && value.length > 0 && (
        <p className={`text-xs ${isValidMobile ? 'text-green-600' : 'text-red-400'}`}>
          {isValidMobile
            ? `UPI ID: ${generatedUpiId}`
            : 'Must be 10 digits starting with 6, 7, 8, or 9'}
        </p>
      )}
    </div>
  );
}

export default function FriendManager({ friends, setFriends, billPayerId, setBillPayerId, onNext, onBack }) {
  const [name, setName] = useState('');
  const [showUpiFor, setShowUpiFor] = useState(null);

  const addFriend = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return;
    const savedUpi = getStoredUpi(trimmed);
    const newFriend = { id: crypto.randomUUID(), name: trimmed, upiId: savedUpi };
    setFriends((prev) => [...prev, newFriend]);
    // Auto-set bill payer to first friend added
    if (friends.length === 0) setBillPayerId(newFriend.id);
    setName('');
  };

  const removeFriend = (id) => {
    setFriends((prev) => {
      const next = prev.filter((f) => f.id !== id);
      // If removed friend was the bill payer, reset to first remaining
      if (id === billPayerId && next.length > 0) {
        setBillPayerId(next[0].id);
      }
      return next;
    });
    if (showUpiFor === id) setShowUpiFor(null);
  };

  const saveUpiId = (id, upiId) => {
    const friend = friends.find((f) => f.id === id);
    if (friend && upiId) storeUpi(friend.name, upiId);
    setFriends((prev) => prev.map((f) => (f.id === id ? { ...f, upiId } : f)));
    setShowUpiFor(null);
  };

  // Ensure billPayerId is always valid
  useEffect(() => {
    if (friends.length > 0 && !friends.find((f) => f.id === billPayerId)) {
      setBillPayerId(friends[0].id);
    }
  }, [friends, billPayerId, setBillPayerId]);

  const canProceed = friends.length >= 2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Add Friends</h2>
        <p className="text-gray-500 text-sm mt-1">Add at least 2 people to split the bill with.</p>
      </div>

      {/* Add Friend Input */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addFriend()}
            placeholder="Friend's name"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
            style={{ fontSize: '16px' }}
            maxLength={30}
          />
          <button
            onClick={addFriend}
            disabled={!name.trim()}
            className="px-5 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors text-sm min-h-[44px]"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Friends List */}
      {friends.length === 0 ? (
        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-gray-200">
          <div className="text-4xl mb-3">👥</div>
          <p className="text-sm">No friends added yet.</p>
          <p className="text-xs mt-1">Add at least 2 to continue.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="space-y-2">
            {friends.map((friend, idx) => (
              <div key={friend.id}>
                {/* Friend row */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-medium flex-1 min-w-0 ${getFriendColorClass(idx)}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
                    <span className="truncate">{friend.name}</span>
                    {friend.upiId && (
                      <span className="text-xs opacity-60 truncate max-w-[100px]">{friend.upiId}</span>
                    )}
                  </div>

                  {/* UPI toggle button */}
                  <button
                    onClick={() => setShowUpiFor(showUpiFor === friend.id ? null : friend.id)}
                    className="text-xs text-gray-400 hover:text-green-600 transition-colors border border-gray-200 rounded-lg px-2 py-1.5 bg-white whitespace-nowrap min-h-[36px]"
                    title={friend.upiId ? 'Edit UPI ID' : 'Add UPI ID'}
                  >
                    {friend.upiId ? '✎ UPI' : '+ UPI'}
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="p-1.5 hover:opacity-60 transition-opacity text-gray-400 min-w-[36px] min-h-[36px] flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Inline UPI editor */}
                {showUpiFor === friend.id && (
                  <UpiEditor friend={friend} onSave={(upi) => saveUpiId(friend.id, upi)} />
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {friends.length} {friends.length === 1 ? 'person' : 'people'} added
            {friends.length < 2 && ' — add 1 more to continue'}
            {friends.some((f) => !f.upiId) && ' · Add UPI IDs to enable direct payment links'}
          </p>

          {/* Who paid the bill */}
          {friends.length >= 2 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <label className="text-xs font-semibold text-gray-600 block mb-2">
                Who paid the bill?
              </label>
              <select
                value={billPayerId || friends[0]?.id || ''}
                onChange={(e) => setBillPayerId(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                style={{ fontSize: '16px' }}
              >
                {friends.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1.5">
                Everyone else owes this person. Used to calculate settlements.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
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
          Assign Items →
        </button>
      </div>
    </div>
  );
}
