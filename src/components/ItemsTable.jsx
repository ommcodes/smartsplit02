import { useState } from 'react';

function fmt(n) {
  return Number(n).toFixed(2);
}

const GST_SLABS = [5, 12, 18, 28];

/**
 * embedded=true: used inside ReceiptsManager — no outer padding, no page header, no nav buttons.
 * embedded=false (default): standalone step with full page layout.
 */
export default function ItemsTable({ items, setItems, gst, setGst, onNext, onBack, embedded = false }) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [gstMode, setGstMode] = useState('amount'); // 'amount' | 'percent'
  const [gstPercent, setGstPercent] = useState('');

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    const name = newName.trim();
    const price = parseFloat(newPrice);
    if (!name || isNaN(price) || price <= 0) return;
    setItems((prev) => [...prev, { id: crypto.randomUUID(), name, price }]);
    setNewName('');
    setNewPrice('');
  };

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);

  const calculatedGstFromPercent =
    gstMode === 'percent'
      ? parseFloat(((parseFloat(gstPercent) || 0) / 100 * subtotal).toFixed(2))
      : null;

  const effectiveGst = gstMode === 'percent' ? (calculatedGstFromPercent ?? 0) : (parseFloat(gst) || 0);
  const total = subtotal + effectiveGst;

  const canProceed = items.length > 0;

  // Wrapper classes differ based on embedded mode
  const outerClass = embedded ? '' : 'max-w-2xl mx-auto px-4 py-8';
  const itemsCardClass = embedded
    ? 'overflow-hidden mb-0'
    : 'bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4';
  const gstCardClass = embedded
    ? 'border-t border-gray-100 px-4 py-3 bg-gray-50/30'
    : 'bg-white rounded-2xl border border-gray-200 p-4 mb-4';
  const totalsCardClass = embedded
    ? 'border-t border-gray-200 px-4 py-3 bg-green-50/50'
    : 'bg-green-50 rounded-2xl border border-green-200 p-4 mb-6';

  return (
    <div className={outerClass}>
      {/* Page header — only in standalone mode */}
      {!embedded && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Review Items</h2>
          <p className="text-gray-500 text-sm mt-1">
            {items.length > 0
              ? `${items.length} item${items.length !== 1 ? 's' : ''} detected. Fix any OCR mistakes.`
              : 'No items detected. Add them manually below.'}
          </p>
        </div>
      )}

      {/* Items list */}
      <div className={itemsCardClass}>
        {items.length === 0 ? (
          <div className="py-10 text-center text-gray-400">
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-sm">No items yet. Add one below.</p>
          </div>
        ) : (
          <div>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''}`}
              >
                {/* Item name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                  className="flex-1 min-w-0 text-sm sm:text-sm text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 py-1"
                  placeholder="Item name"
                  style={{ fontSize: '16px' }}
                />
                {/* Price */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <span className="text-gray-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                    className="w-20 text-right text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 py-1"
                    style={{ fontSize: '16px' }}
                    step="0.01"
                    min="0"
                  />
                </div>
                {/* Remove */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Row */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Item name"
            className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            style={{ fontSize: '16px' }}
          />
          <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden shrink-0">
            <span className="text-gray-400 text-sm pl-2">₹</span>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="0.00"
              className="w-20 px-2 py-2 focus:outline-none bg-transparent"
              style={{ fontSize: '16px' }}
              step="0.01"
              min="0"
            />
          </div>
          <button
            onClick={addItem}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0 min-h-[44px]"
          >
            + Add
          </button>
        </div>
      </div>

      {/* GST Section */}
      <div className={gstCardClass}>
        <div className={`flex items-center justify-between ${embedded ? 'mb-2' : 'mb-3'}`}>
          <div>
            <p className="text-sm font-semibold text-gray-700">GST / Tax</p>
            {!embedded && <p className="text-xs text-gray-400 mt-0.5">Will be split proportionally</p>}
          </div>
          {/* ₹ / % toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => {
                setGstMode('amount');
                if (gstMode === 'percent') setGst(calculatedGstFromPercent ?? 0);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${gstMode === 'amount' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              ₹ Amount
            </button>
            <button
              onClick={() => {
                setGstMode('percent');
                setGstPercent('');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${gstMode === 'percent' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              % Rate
            </button>
          </div>
        </div>

        {gstMode === 'amount' ? (
          <div className="flex items-center justify-end gap-1">
            <span className="text-gray-500 font-medium">₹</span>
            <input
              type="number"
              value={gst}
              onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
              className="w-24 text-right font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
              style={{ fontSize: '16px' }}
              step="0.01"
              min="0"
            />
          </div>
        ) : (
          <div className="space-y-2">
            {/* Quick-select slabs */}
            <div className="flex gap-2">
              {GST_SLABS.map((slab) => (
                <button
                  key={slab}
                  onClick={() => {
                    setGstPercent(String(slab));
                    setGst(parseFloat(((slab / 100) * subtotal).toFixed(2)));
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                    parseFloat(gstPercent) === slab
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400 hover:text-green-600'
                  }`}
                >
                  {slab}%
                </button>
              ))}
            </div>
            {/* Custom % input + live preview */}
            <div className="flex items-center gap-2">
              <div className="flex items-center flex-1 border border-gray-200 rounded-lg overflow-hidden bg-white">
                <input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGstPercent(val);
                    setGst(parseFloat(((parseFloat(val) || 0) / 100 * subtotal).toFixed(2)));
                  }}
                  placeholder="Custom %"
                  className="flex-1 px-3 py-1.5 focus:outline-none bg-transparent"
                  style={{ fontSize: '16px' }}
                  step="0.01"
                  min="0"
                  max="100"
                />
                <span className="text-gray-400 text-sm pr-2 font-medium">%</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
                <span className="text-gray-400">=</span>
                <span className="font-semibold text-gray-800 whitespace-nowrap">
                  ₹{fmt(calculatedGstFromPercent ?? 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Totals */}
      <div className={totalsCardClass}>
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Items subtotal</span>
          <span>₹{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>GST / Tax{gstMode === 'percent' && gstPercent ? ` (${gstPercent}%)` : ''}</span>
          <span>₹{fmt(effectiveGst)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 border-t border-green-200 pt-2">
          <span>Total</span>
          <span className="text-green-600">₹{fmt(total)}</span>
        </div>
      </div>

      {/* Nav buttons — standalone mode only */}
      {!embedded && (
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
            Add Friends →
          </button>
        </div>
      )}
    </div>
  );
}
