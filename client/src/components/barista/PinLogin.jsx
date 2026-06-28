import { useState } from 'react';

function PinLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onLogin(pin);
    if (!success) {
      setError('Invalid PIN');
      setPin('');
    }
  };

  const handlePinClick = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // Auto-submit when 4 digits are entered
      if (newPin.length === 4) {
        setTimeout(() => {
          const success = onLogin(newPin);
          if (!success) {
            setError('Invalid PIN');
            setPin('');
          }
        }, 100);
      }
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Barista Access
        </h2>

        {/* PIN Display */}
        <div className="mb-8">
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-16 h-16 rounded-full border-4 border-gray-300 flex items-center justify-center"
              >
                {pin.length > i && (
                  <div className="w-4 h-4 rounded-full bg-primary" />
                )}
              </div>
            ))}
          </div>
          {error && (
            <p className="text-red-500 text-center font-semibold">{error}</p>
          )}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinClick(digit.toString())}
              className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-3xl font-bold text-gray-800 transition-all"
            >
              {digit}
            </button>
          ))}
          <div /> {/* Empty space */}
          <button
            onClick={() => handlePinClick('0')}
            className="aspect-square bg-gray-100 hover:bg-gray-200 rounded-xl text-3xl font-bold text-gray-800 transition-all"
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="aspect-square bg-red-500 hover:bg-red-600 rounded-xl text-2xl font-bold text-white transition-all"
          >
            ✕
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm">
          Enter your 4-digit PIN to access the barista dashboard
        </p>
      </div>
    </div>
  );
}

export default PinLogin;
