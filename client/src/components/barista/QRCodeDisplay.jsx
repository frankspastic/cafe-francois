import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

function QRCodeDisplay() {
  const [guestUrl, setGuestUrl] = useState('');

  useEffect(() => {
    // Get the current host and construct the guest URL
    const url = `${window.location.protocol}//${window.location.host}/order`;
    setGuestUrl(url);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Guest Ordering QR Code
        </h2>

        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">
              Scan to Order Coffee
            </h3>
            <p className="text-gray-600">
              Guests can scan this QR code with their phone to place an order
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <QRCodeSVG
                value={guestUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Or visit directly:</p>
            <code className="bg-gray-100 px-4 py-2 rounded-lg text-primary font-mono text-sm">
              {guestUrl}
            </code>
          </div>

          <button
            onClick={handlePrint}
            className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-secondary transition-all"
          >
            🖨️ Print QR Code
          </button>
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <h4 className="font-bold text-blue-900 mb-2">💡 Tips:</h4>
          <ul className="text-blue-800 space-y-2">
            <li>• Print this QR code and display it prominently</li>
            <li>• Guests can scan with their phone camera to order</li>
            <li>• They'll receive notifications when their order is ready</li>
          </ul>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bg-white, .bg-white * {
            visibility: visible;
          }
          .bg-white {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default QRCodeDisplay;
