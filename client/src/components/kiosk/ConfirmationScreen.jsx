function ConfirmationScreen({ customerName }) {
  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="w-32 h-32 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
          <span className="text-6xl">✓</span>
        </div>
        <h1 className="text-6xl font-bold text-stone-100 mb-4 tracking-tight">Order Placed!</h1>
        <p className="text-3xl text-accent mb-3">Thank you, {customerName}!</p>
        <p className="text-xl text-stone-500">Your coffee is being prepared...</p>
      </div>
    </div>
  );
}

export default ConfirmationScreen;
