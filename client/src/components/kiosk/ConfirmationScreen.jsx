function ConfirmationScreen({ customerName }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center p-8">
      <div className="text-center text-white">
        <div className="text-9xl mb-8">✅</div>
        <h1 className="text-6xl font-bold mb-6">Order Confirmed!</h1>
        <p className="text-4xl mb-4">Thank you, {customerName}!</p>
        <p className="text-2xl opacity-90">Your coffee is being prepared...</p>
      </div>
    </div>
  );
}

export default ConfirmationScreen;
