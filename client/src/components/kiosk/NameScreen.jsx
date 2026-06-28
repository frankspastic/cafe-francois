import { useState } from 'react';

function NameScreen({ onSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          What's your name?
        </h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            className="w-full px-8 py-6 text-3xl border-2 border-gray-300 rounded-xl focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-primary text-white px-8 py-6 rounded-xl text-3xl font-semibold hover:bg-secondary transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameScreen;
