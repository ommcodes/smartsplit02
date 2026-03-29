import { useState } from 'react';
import './App.css';
import Stepper from './components/Stepper';
import ReceiptUpload from './components/ReceiptUpload';
import ReceiptsManager from './components/ReceiptsManager';
import FriendManager from './components/FriendManager';
import ItemAssignment from './components/ItemAssignment';
import SplitSummary from './components/SplitSummary';
import LicensePage from './components/LicensePage';

function App() {
  const [showLicense, setShowLicense] = useState(false);
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Multiple receipts: [{ id, name, items, gst }]
  const [receipts, setReceipts] = useState([]);

  // Friends: [{ id, name, upiId }]
  const [friends, setFriends] = useState([]);

  // Who paid the bill
  const [billPayerId, setBillPayerId] = useState('');

  // Assignments: { itemId: [friendId, ...] }
  const [assignments, setAssignments] = useState({});

  // Tip: { amount: string, isPercent: boolean, mode: 'equal'|'proportional'|'progressive' }
  const [tip, setTip] = useState({ amount: '', isPercent: false, mode: 'equal' });

  // Derived — passed to steps 4 & 5
  const allItems = receipts.flatMap((r) => r.items);
  const totalGst = receipts.reduce((s, r) => s + (parseFloat(r.gst) || 0), 0);

  const goToStep = (n) => {
    setStep(n);
    if (n > maxReachedStep) setMaxReachedStep(n);
  };

  const next = () => goToStep(step + 1);
  const back = () => goToStep(step - 1);

  const handleParsed = (parsed) => {
    setReceipts([{
      id: crypto.randomUUID(),
      name: 'Receipt 1',
      items: parsed.items,
      gst: parsed.gst,
    }]);
    setAssignments({});
  };

  const handleReset = () => {
    setStep(1);
    setMaxReachedStep(1);
    setReceipts([]);
    setFriends([]);
    setBillPayerId('');
    setAssignments({});
    setTip({ amount: '', isPercent: false, mode: 'equal' });
    // Clear settled payments from localStorage
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('smartsplit_settled_'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
  };

  if (showLicense) {
    return <LicensePage onClose={() => setShowLicense(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper currentStep={step} onStepClick={goToStep} maxReachedStep={maxReachedStep} />

      {/* pb-24 keeps content above mobile keyboard / bottom nav */}
      <div className="pb-24">
        {step === 1 && (
          <ReceiptUpload
            onParsed={handleParsed}
            onNext={next}
          />
        )}

        {step === 2 && (
          <ReceiptsManager
            receipts={receipts}
            setReceipts={setReceipts}
            setAssignments={setAssignments}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 3 && (
          <FriendManager
            friends={friends}
            setFriends={setFriends}
            billPayerId={billPayerId}
            setBillPayerId={setBillPayerId}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 4 && (
          <ItemAssignment
            items={allItems}
            friends={friends}
            assignments={assignments}
            setAssignments={setAssignments}
            tip={tip}
            setTip={setTip}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 5 && (
          <SplitSummary
            items={allItems}
            receipts={receipts}
            friends={friends}
            assignments={assignments}
            gst={totalGst}
            tip={tip}
            billPayerId={billPayerId}
            onBack={back}
            onReset={handleReset}
          />
        )}
      </div>

      <footer className="text-center pb-6">
        <button
          onClick={() => setShowLicense(true)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          PolyForm Noncommercial License 1.0.0
        </button>
      </footer>
    </div>
  );
}

export default App;
