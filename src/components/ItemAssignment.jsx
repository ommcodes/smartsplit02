import { getFriendColorClass, getFriendDotColor } from './FriendManager';

function fmt(n) {
  return Number(n).toFixed(2);
}

export default function ItemAssignment({ items, friends, assignments, setAssignments, onNext, onBack }) {
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
  const canProceed = unassignedItems.length === 0 && items.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assign Items</h2>
          <p className="text-gray-500 text-sm mt-1">Tap a name to assign them to an item.</p>
        </div>
        <button
          onClick={assignAllToEveryone}
          className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors whitespace-nowrap"
        >
          Assign all equally
        </button>
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
          const share = assigned.length > 0 ? item.price / assigned.length : 0;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 transition-all ${
                assigned.length === 0 ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm leading-tight truncate">{item.name}</p>
                  <p className="text-green-600 font-semibold text-sm mt-0.5">₹{fmt(item.price)}</p>
                </div>
                <div className="text-right shrink-0">
                  {assigned.length > 0 ? (
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-700">₹{fmt(share)}</span> each
                    </div>
                  ) : (
                    <span className="text-xs text-orange-500 font-medium">Unassigned</span>
                  )}
                </div>
              </div>

              {/* Friend Checkboxes */}
              <div className="flex flex-wrap gap-2">
                {friends.map((friend, idx) => {
                  const isSelected = assigned.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleAssignment(item.id, friend.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all active:scale-95 ${
                        isSelected
                          ? getFriendColorClass(idx) + ' shadow-sm'
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {isSelected ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 rounded-full border-2 border-current" />
                      )}
                      {friend.name}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => assignAll(item.id)}
                  className="text-xs text-gray-400 hover:text-green-600 transition-colors"
                >
                  Select all
                </button>
                {assigned.length > 0 && (
                  <button
                    onClick={() => clearAll(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {unassignedItems.length > 0 && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-orange-600 text-sm">
          ⚠️ {unassignedItems.length} item{unassignedItems.length !== 1 ? 's' : ''} still unassigned
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
