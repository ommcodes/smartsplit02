import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../utils/parseReceipt';
import ItemsTable from './ItemsTable';

function fmt(n) {
  return Number(n).toFixed(2);
}

/** Compact inline uploader shown when user taps "Add Another Receipt" */
function InlineReceiptAdder({ onAdd, onCancel }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    setError('');
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setProgress(0);
    setError('');
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100));
        },
      });
      const result = await worker.recognize(image);
      await worker.terminate();
      onAdd(parseReceiptText(result.data.text));
    } catch (err) {
      setError('OCR failed: ' + err.message);
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  const handleManualEntry = () => onAdd({ items: [], gst: 0, total: 0 });

  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-green-300 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Add Another Receipt</p>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 underline">
          Cancel
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {imageUrl ? (
        <div className="relative mb-3">
          <img src={imageUrl} alt="Receipt preview" className="max-h-40 mx-auto rounded-lg object-contain" />
          <button
            onClick={() => { setImage(null); setImageUrl(null); }}
            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow text-gray-500 hover:text-red-500 min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          className="border border-dashed border-gray-200 rounded-xl py-6 text-center cursor-pointer hover:border-green-400 hover:bg-green-50/50 transition-all mb-3"
        >
          <div className="text-2xl mb-1">📷</div>
          <p className="text-xs text-gray-500">Tap to upload or take a photo</p>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

      {scanning && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-xs text-gray-600 font-medium">Scanning… {progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleScan}
          disabled={!image || scanning}
          className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-xl transition-colors min-h-[44px]"
        >
          {scanning ? 'Scanning…' : '🔍 Scan'}
        </button>
        <button
          onClick={handleManualEntry}
          className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors min-h-[44px]"
        >
          ✏️ Manual
        </button>
      </div>
    </div>
  );
}

/** Collapsible card for one receipt */
function ReceiptCard({ receipt, receiptIndex, totalReceipts, onUpdate, onRemove }) {
  const [collapsed, setCollapsed] = useState(receiptIndex > 0);

  const receiptSubtotal = receipt.items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const receiptTotal = receiptSubtotal + (parseFloat(receipt.gst) || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 flex-1 min-w-0 text-left"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${collapsed ? '-rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <input
            type="text"
            value={receipt.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="font-semibold text-gray-900 bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-green-400 rounded px-1 flex-1 min-w-0 truncate"
            style={{ fontSize: '16px' }}
            placeholder="Receipt name"
          />
          <span className="text-green-600 font-semibold text-sm whitespace-nowrap shrink-0">
            ₹{fmt(receiptTotal)}
          </span>
        </button>

        {/* Remove button — only when more than one receipt */}
        {totalReceipts > 1 && (
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded min-w-[36px] min-h-[36px] flex items-center justify-center shrink-0"
            title="Remove this receipt"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Inline ItemsTable (embedded) — hidden when collapsed */}
      {!collapsed && (
        <ItemsTable
          embedded
          items={receipt.items}
          setItems={(updater) =>
            onUpdate({ items: typeof updater === 'function' ? updater(receipt.items) : updater })
          }
          gst={receipt.gst}
          setGst={(val) =>
            onUpdate({ gst: typeof val === 'function' ? val(receipt.gst) : val })
          }
        />
      )}
    </div>
  );
}

export default function ReceiptsManager({ receipts, setReceipts, setAssignments, onNext, onBack }) {
  const [showAdder, setShowAdder] = useState(false);

  const updateReceipt = (id, changes) => {
    setReceipts((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));
  };

  const removeReceipt = (id) => {
    // Clean up assignments for this receipt's items
    const target = receipts.find((r) => r.id === id);
    if (target) {
      setAssignments((prev) => {
        const next = { ...prev };
        target.items.forEach((item) => delete next[item.id]);
        return next;
      });
    }
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  const addReceipt = (parsed) => {
    const newReceipt = {
      id: crypto.randomUUID(),
      name: `Receipt ${receipts.length + 1}`,
      items: parsed.items,
      gst: parsed.gst,
    };
    setReceipts((prev) => [...prev, newReceipt]);
    setShowAdder(false);
  };

  const allItems = receipts.flatMap((r) => r.items);
  const totalSubtotal = allItems.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const totalGst = receipts.reduce((s, r) => s + (parseFloat(r.gst) || 0), 0);
  const grandTotal = totalSubtotal + totalGst;

  const canProceed = allItems.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Review Items</h2>
        <p className="text-gray-500 text-sm mt-1">
          {receipts.length === 1
            ? `${allItems.length} item${allItems.length !== 1 ? 's' : ''} detected. Fix any OCR mistakes.`
            : `${receipts.length} receipts · ${allItems.length} items total`}
        </p>
      </div>

      {/* Receipt cards */}
      <div className="space-y-4 mb-4">
        {receipts.map((receipt, idx) => (
          <ReceiptCard
            key={receipt.id}
            receipt={receipt}
            receiptIndex={idx}
            totalReceipts={receipts.length}
            onUpdate={(changes) => updateReceipt(receipt.id, changes)}
            onRemove={() => removeReceipt(receipt.id)}
          />
        ))}
      </div>

      {/* Add another receipt */}
      {showAdder ? (
        <InlineReceiptAdder onAdd={addReceipt} onCancel={() => setShowAdder(false)} />
      ) : (
        <button
          onClick={() => setShowAdder(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 rounded-2xl hover:border-green-400 hover:text-green-600 transition-colors text-sm font-medium mb-4 min-h-[48px]"
        >
          + Add Another Receipt
        </button>
      )}

      {/* Combined totals — only shown when multiple receipts */}
      {receipts.length > 1 && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-4 mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Combined Total ({receipts.length} receipts)
          </p>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>All items subtotal</span>
            <span>₹{fmt(totalSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Total GST / Tax</span>
            <span>₹{fmt(totalGst)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-green-200 pt-2">
            <span>Grand Total</span>
            <span className="text-green-600">₹{fmt(grandTotal)}</span>
          </div>
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
          Add Friends →
        </button>
      </div>
    </div>
  );
}
