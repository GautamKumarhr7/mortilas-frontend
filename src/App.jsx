import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import AppLayout from './layouts/AppLayout';
import Login from './modules/auth/pages/Login';
import Register from './modules/auth/pages/Register';
import JobPortal from './modules/hr/pages/JobPortal';
import { AppProvider } from './context/AppContext';

function AppContent() {
  const { isLoggedIn, userProfile } = useSelector((state) => state.auth);

  if (!isLoggedIn) {
    if (window.location.pathname === '/register') {
      return <Register />;
    }
    return <Login />;
  }

  if (userProfile?.type === 'applicant') {
    return <JobPortal />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-right" reverseOrder={false} />
      <AppContent />
    </AppProvider>
  );
}
