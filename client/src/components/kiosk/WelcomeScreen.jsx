import { useEffect, useState } from 'react';
import { settingsAPI } from '../../services/api';

function WelcomeScreen({ onStart }) {
  const [bgUrl, setBgUrl] = useState('');

  useEffect(() => {
    settingsAPI.getAll().then(s => {
      if (s.background_image_url) setBgUrl(s.background_image_url);
    }).catch(() => {});
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-stone-950 overflow-hidden">
      {/* Background image */}
      {bgUrl && (
        <>
          <img
            src={bgUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-stone-950/70" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 text-center px-8">
        <h1 className="text-7xl font-bold text-stone-100 mb-4 tracking-tight">
          Welcome to
        </h1>
        <h1 className="text-7xl font-bold text-stone-100 mb-16 tracking-tight">
          Café François
        </h1>
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
