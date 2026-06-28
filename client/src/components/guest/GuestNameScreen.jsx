import { useState } from 'react';

function GuestNameScreen({ onSubmit, onBack }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          What's your name?
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 bg-primary text-white px-4 py-3 rounded-lg font-semibold hover:bg-secondary transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Place Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GuestNameScreen;
