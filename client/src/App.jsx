import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import KioskView from './views/KioskView';
import GuestView from './views/GuestView';
import BaristaView from './views/BaristaView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/kiosk" replace />} />
        <Route path="/kiosk" element={<KioskView />} />
        <Route path="/order" element={<GuestView />} />
        <Route path="/barista" element={<BaristaView />} />
      </Routes>
    </Router>
  );
}

export default App;
