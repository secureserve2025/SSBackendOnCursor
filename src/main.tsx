import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import FreelancerLogin from './components/FreelancerLogin.tsx';
import ClientLogin from './components/ClientLogin.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login/freelancer" element={<FreelancerLogin />} />
        <Route path="/login/client" element={<ClientLogin />} />
      </Routes>
    </Router>
  </StrictMode>
);
