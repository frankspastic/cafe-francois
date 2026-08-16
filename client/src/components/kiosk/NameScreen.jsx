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
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-4xl font-bold text-stone-100">What&rsquo;s your name?</h2>
          <p className="text-stone-500 mt-2">So we know whose coffee is whose</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            className="w-full px-8 py-6 text-3xl bg-stone-800 border-2 border-stone-700 text-stone-100 placeholder-stone-600 rounded-2xl focus:border-accent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full bg-accent text-stone-900 px-8 py-6 rounded-2xl text-3xl font-bold hover:brightness-110 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
          >
            Place Order
          </button>
        </form>
      </div>
    </div>
  );
}

export default NameScreen;
