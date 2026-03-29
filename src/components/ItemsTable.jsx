import { useState } from 'react';

function fmt(n) {
  return Number(n).toFixed(2);
}

export default function ItemsTable({ items, setItems, gst, setGst, onNext, onBack }) {
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const updateItem = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: field === 'price' ? parseFloat(value) || 0 : value } : item))
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
  const total = subtotal + (parseFloat(gst) || 0);

  const canProceed = items.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Review Items</h2>
        <p className="text-gray-500 text-sm mt-1">
          {items.length > 0
            ? `${items.length} item${items.length !== 1 ? 's' : ''} detected. Fix any OCR mistakes.`
            : 'No items detected. Add them manually below.'}
        </p>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
        {items.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <div className="text-3xl mb-2">🛒</div>
            <p className="text-sm">No items yet. Add one below.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Item</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3 w-28">Price (₹)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={`border-b border-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      className="w-full text-sm text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 py-1"
                      placeholder="Item name"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-gray-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        className="w-20 text-right text-sm text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 py-1"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </td>
                  <td className="pr-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Add Item Row */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Item name"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
          />
          <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden">
            <span className="text-gray-400 text-sm pl-2">₹</span>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder="0.00"
              className="w-20 text-sm px-2 py-2 focus:outline-none bg-transparent"
              step="0.01"
              min="0"
            />
          </div>
          <button
            onClick={addItem}
            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {/* GST Row */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">GST / Tax</p>
            <p className="text-xs text-gray-400 mt-0.5">Will be split proportionally</p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-500 font-medium">₹</span>
            <input
              type="number"
              value={gst}
              onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
              className="w-24 text-right font-semibold text-gray-800 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-400"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Items subtotal</span>
          <span>₹{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>GST / Tax</span>
          <span>₹{fmt(gst)}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 border-t border-green-200 pt-2">
          <span>Grand Total</span>
          <span className="text-green-600">₹{fmt(total)}</span>
        </div>
      </div>

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
    </div>
  );
}
