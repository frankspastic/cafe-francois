function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 p-8">
      <div className="text-center">
        <div className="text-9xl mb-6">☕</div>
        <h1 className="text-7xl font-bold text-stone-100 mb-3 tracking-tight">
          Café François
        </h1>
        <p className="text-2xl text-stone-400 mb-16">
          Order your complimentary coffee
        </p>
        <button
          onClick={onStart}
          className="bg-accent text-stone-900 px-20 py-7 rounded-full text-3xl font-bold hover:brightness-110 transition-all transform hover:scale-105 shadow-2xl shadow-accent/20"
        >
          Start Order
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
