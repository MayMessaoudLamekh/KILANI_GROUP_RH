import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Missions from './pages/Missions';
import Attestations from './pages/Attestations';
import Settings from './pages/Settings';
import LeaveMotifs from './pages/LeaveMotifs';
import AttestationTypes from './pages/AttestationTypes';

function App() {
  // Auth: check localStorage for token
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
      >
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<Employees />} />
        <Route path="leave-motifs" element={<LeaveMotifs />} />
        <Route path="attestation-types" element={<AttestationTypes />} />
        <Route path="settings" element={<Settings />} />
        <Route path="leaves" element={<Leaves />} />
        <Route path="missions" element={<Missions />} />
        <Route path="attestations" element={<Attestations />} />
      </Route>
    </Routes>
  );
}

export default App;
