import { useState } from 'react';

function PinLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePinClick = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
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

  const handleClear = () => { setPin(''); setError(''); };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-12 max-w-md w-full">
        <h2 className="text-4xl font-bold text-stone-100 mb-2 text-center">Café François</h2>
        <p className="text-stone-500 text-center mb-8">Barista Access</p>

        <div className="mb-8">
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 rounded-full border-2 border-stone-700 flex items-center justify-center">
                {pin.length > i && <div className="w-5 h-5 rounded-full bg-accent" />}
              </div>
            ))}
          </div>
          {error && <p className="text-red-400 text-center font-semibold">{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinClick(digit.toString())}
              className="aspect-square bg-stone-800 hover:bg-stone-700 rounded-xl text-3xl font-bold text-stone-100 transition-all"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePinClick('0')}
            className="aspect-square bg-stone-800 hover:bg-stone-700 rounded-xl text-3xl font-bold text-stone-100 transition-all"
          >
            0
          </button>
          <button
            onClick={handleClear}
            className="aspect-square bg-red-900/40 hover:bg-red-800/60 rounded-xl text-2xl font-bold text-red-400 transition-all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinLogin;
