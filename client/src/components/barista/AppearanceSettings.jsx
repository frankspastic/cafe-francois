import { useState, useEffect } from 'react';
import { settingsAPI, baristaAPI } from '../../services/api';

function AppearanceSettings() {
  const [bgUrl, setBgUrl] = useState('');
  const [saved, setSaved] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    settingsAPI.getAll().then(s => {
      if (s.background_image_url) setBgUrl(s.background_image_url);
    });
  }, []);

  const handleSave = async () => {
    await settingsAPI.set('background_image_url', bgUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinError('');

    if (!/^\d{4}$/.test(newPin)) {
      setPinError('New PIN must be 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match');
      return;
    }

    try {
      await baristaAPI.changePin(currentPin, newPin);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2000);
    } catch (error) {
      setPinError(error.message);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-stone-100 mb-6">Appearance</h2>

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 max-w-2xl">
        <h3 className="text-lg font-bold text-stone-200 mb-1">Welcome Screen Background</h3>
        <p className="text-sm text-stone-500 mb-4">
          Paste any image URL. It displays full-screen behind the logo on the kiosk splash screen.
        </p>

        <div className="space-y-4">
          <input
            type="url"
            value={bgUrl}
            onChange={e => setBgUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none text-sm"
          />

          {bgUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-700 h-48 bg-stone-800">
              <img
                src={bgUrl}
                alt="Background preview"
                className="w-full h-full object-cover"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-accent text-stone-900 px-6 py-2.5 rounded-lg font-semibold hover:brightness-110 transition-all"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
            {bgUrl && (
              <button
                onClick={() => { setBgUrl(''); settingsAPI.set('background_image_url', ''); }}
                className="bg-stone-700 text-stone-300 px-6 py-2.5 rounded-lg font-semibold hover:bg-stone-600 transition-all"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 max-w-2xl mt-8">
        <h3 className="text-lg font-bold text-stone-200 mb-1">Barista PIN</h3>
        <p className="text-sm text-stone-500 mb-4">
          Change the 4-digit PIN used to access this dashboard.
        </p>

        <form onSubmit={handleChangePin} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Current PIN"
            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none text-sm tracking-widest"
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="New PIN"
            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none text-sm tracking-widest"
          />
          <input
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={confirmPin}
            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Confirm New PIN"
            className="w-full px-4 py-3 bg-stone-800 border border-stone-700 text-stone-100 placeholder-stone-500 rounded-lg focus:border-accent focus:outline-none text-sm tracking-widest"
          />

          {pinError && <p className="text-red-400 text-sm font-semibold">{pinError}</p>}

          <button
            type="submit"
            className="bg-accent text-stone-900 px-6 py-2.5 rounded-lg font-semibold hover:brightness-110 transition-all"
          >
            {pinSaved ? '✓ Saved' : 'Update PIN'}
          </button>
        </form>
      </div>

      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 max-w-2xl mt-8">
        <h3 className="text-lg font-bold text-stone-200 mb-1">Backup</h3>
        <p className="text-sm text-stone-500 mb-4">
          Download a copy of the database — menu, settings, and order history. Keep one
          around before a redeploy or a big menu change.
        </p>
        <a
          href={baristaAPI.backupUrl()}
          className="inline-block bg-stone-700 text-stone-200 px-6 py-2.5 rounded-lg font-semibold hover:bg-stone-600 transition-all"
        >
          Download backup
        </a>
      </div>
    </div>
  );
}

export default AppearanceSettings;
