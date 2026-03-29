import { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { parseReceiptText } from '../utils/parseReceipt';

export default function ReceiptUpload({ onParsed, onNext }) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [rawText, setRawText] = useState('');
  const inputRef = useRef(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please upload a JPG or PNG image.');
      return;
    }
    setError('');
    setRawText('');
    setImage(file);
    setImageUrl(URL.createObjectURL(file));
  }, []);

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const handleScan = async () => {
    if (!image) return;
    setScanning(true);
    setProgress(0);
    setError('');
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const result = await worker.recognize(image);
      await worker.terminate();
      const text = result.data.text;
      setRawText(text);
      const parsed = parseReceiptText(text);
      onParsed(parsed, text);
      onNext();
    } catch (err) {
      setError('OCR failed: ' + err.message);
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  const handleManualEntry = () => {
    onParsed({ items: [], gst: 0, total: 0 }, '');
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🧾</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">SmartSplit</h1>
        <p className="text-gray-500 text-sm">Upload your receipt to split bills fairly with proportional GST</p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => !image && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl transition-all ${
          dragging
            ? 'border-green-400 bg-green-50'
            : image
            ? 'border-green-300 bg-green-50'
            : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {imageUrl ? (
          <div className="p-4">
            <img
              src={imageUrl}
              alt="Receipt preview"
              className="max-h-72 mx-auto rounded-xl object-contain shadow-sm"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setImage(null);
                setImageUrl(null);
                setRawText('');
              }}
              className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow text-gray-500 hover:text-red-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="py-14 px-6 text-center">
            <div className="text-4xl mb-3">📷</div>
            <p className="text-gray-600 font-medium">Drag &amp; drop receipt here</p>
            <p className="text-gray-400 text-sm mt-1">or click to browse</p>
            <p className="text-gray-300 text-xs mt-3">JPG, PNG supported</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Scanning progress */}
      {scanning && (
        <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 font-medium">Scanning receipt… {progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        <button
          onClick={handleScan}
          disabled={!image || scanning}
          className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-xl transition-all active:scale-95"
        >
          {scanning ? 'Scanning…' : '🔍 Scan Receipt'}
        </button>

        <button
          onClick={handleManualEntry}
          className="w-full py-3 bg-white hover:bg-gray-50 text-gray-600 font-medium rounded-xl border border-gray-200 transition-all active:scale-95"
        >
          ✏️ Enter items manually
        </button>
      </div>

      {rawText && (
        <details className="mt-4">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            View raw OCR text
          </summary>
          <pre className="mt-2 text-xs text-gray-400 bg-gray-50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap">
            {rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
