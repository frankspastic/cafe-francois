import { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';

function AppearanceSettings() {
  const [bgUrl, setBgUrl] = useState('');
  const [saved, setSaved] = useState(false);

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

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Appearance</h2>

      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl">
        <h3 className="text-lg font-bold text-gray-700 mb-1">Welcome Screen Background</h3>
        <p className="text-sm text-gray-500 mb-4">
          Paste any image URL. It will display full-screen behind the Café François logo on the kiosk splash screen.
        </p>

        <div className="space-y-4">
          <input
            type="url"
            value={bgUrl}
            onChange={e => setBgUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none text-sm"
          />

          {bgUrl && (
            <div className="rounded-xl overflow-hidden border border-gray-200 h-48 bg-gray-100">
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
              className="bg-primary text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-secondary transition-all"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
            {bgUrl && (
              <button
                onClick={() => { setBgUrl(''); settingsAPI.set('background_image_url', ''); }}
                className="bg-gray-200 text-gray-600 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppearanceSettings;
