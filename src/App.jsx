import { useState } from 'react';
import './App.css';
import Stepper from './components/Stepper';
import ReceiptUpload from './components/ReceiptUpload';
import ItemsTable from './components/ItemsTable';
import FriendManager from './components/FriendManager';
import ItemAssignment from './components/ItemAssignment';
import SplitSummary from './components/SplitSummary';
import LicensePage from './components/LicensePage';

function App() {
  const [showLicense, setShowLicense] = useState(false);
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);

  // Receipt data
  const [items, setItems] = useState([]);
  const [gst, setGst] = useState(0);

  // Friends
  const [friends, setFriends] = useState([]);

  // Assignments: { itemId: [friendId, ...] }
  const [assignments, setAssignments] = useState({});

  const goToStep = (n) => {
    setStep(n);
    if (n > maxReachedStep) setMaxReachedStep(n);
  };

  const next = () => goToStep(step + 1);
  const back = () => goToStep(step - 1);

  const handleParsed = (parsed) => {
    setItems(parsed.items);
    setGst(parsed.gst);
    setAssignments({});
  };

  const handleReset = () => {
    setStep(1);
    setMaxReachedStep(1);
    setItems([]);
    setGst(0);
    setFriends([]);
    setAssignments({});
  };

  if (showLicense) {
    return <LicensePage onClose={() => setShowLicense(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Stepper currentStep={step} onStepClick={goToStep} maxReachedStep={maxReachedStep} />

      <div className="pb-8">
        {step === 1 && (
          <ReceiptUpload
            onParsed={handleParsed}
            onNext={next}
          />
        )}

        {step === 2 && (
          <ItemsTable
            items={items}
            setItems={setItems}
            gst={gst}
            setGst={setGst}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 3 && (
          <FriendManager
            friends={friends}
            setFriends={setFriends}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 4 && (
          <ItemAssignment
            items={items}
            friends={friends}
            assignments={assignments}
            setAssignments={setAssignments}
            onNext={next}
            onBack={back}
          />
        )}

        {step === 5 && (
          <SplitSummary
            items={items}
            friends={friends}
            assignments={assignments}
            gst={gst}
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
