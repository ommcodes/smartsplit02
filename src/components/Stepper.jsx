const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Review Items' },
  { id: 3, label: 'Add Friends' },
  { id: 4, label: 'Assign' },
  { id: 5, label: 'Summary' },
];

export default function Stepper({ currentStep, onStepClick, maxReachedStep }) {
  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, idx) => {
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            const isReachable = step.id <= maxReachedStep;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => isReachable && onStepClick(step.id)}
                  disabled={!isReachable}
                  className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                    isReachable ? 'cursor-pointer' : 'cursor-not-allowed'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-green-500 text-white ring-2 ring-green-200'
                        : isReachable
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <span
                    className={`text-xs hidden sm:block font-medium ${
                      isCurrent ? 'text-green-600' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 rounded transition-all ${
                      step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
