function WelcomeScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary to-secondary text-white p-8">
      <div className="text-center">
        <h1 className="text-7xl font-bold mb-4">☕ Café François</h1>
        <p className="text-3xl mb-12 opacity-90">Welcome! Order your complimentary coffee</p>
        <button
          onClick={onStart}
          className="bg-white text-primary px-16 py-6 rounded-full text-3xl font-semibold hover:bg-accent hover:text-white transition-all transform hover:scale-105 shadow-2xl"
        >
          Start Your Order
        </button>
      </div>
    </div>
  );
}

export default WelcomeScreen;
