import { useState } from 'react';

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

export function getFriendColorClass(index) {
  return COLORS[index % COLORS.length];
}

export function getFriendDotColor(index) {
  return DOT_COLORS[index % DOT_COLORS.length];
}

export default function FriendManager({ friends, setFriends, onNext, onBack }) {
  const [name, setName] = useState('');

  const addFriend = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      return; // duplicate
    }
    setFriends((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed }]);
    setName('');
  };

  const removeFriend = (id) => {
    setFriends((prev) => prev.filter((f) => f.id !== id));
  };

  const canProceed = friends.length >= 2;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
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
            className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
            maxLength={30}
          />
          <button
            onClick={addFriend}
            disabled={!name.trim()}
            className="px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-colors text-sm"
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
          <div className="flex flex-wrap gap-2">
            {friends.map((friend, idx) => (
              <div
                key={friend.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium ${getFriendColorClass(idx)}`}
              >
                <div className={`w-2 h-2 rounded-full ${DOT_COLORS[idx % DOT_COLORS.length]}`} />
                <span>{friend.name}</span>
                <button
                  onClick={() => removeFriend(friend.id)}
                  className="ml-1 hover:opacity-60 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            {friends.length} {friends.length === 1 ? 'person' : 'people'} added
            {friends.length < 2 && ' — add 1 more to continue'}
          </p>
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
