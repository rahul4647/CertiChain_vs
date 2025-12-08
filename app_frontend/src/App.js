import React, { useEffect } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Pages
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateCertificatePage } from './pages/CreateCertificatePage';
import { GroupDetailsPage } from './pages/GroupDetailsPage';
import { ClaimPage } from './pages/ClaimPage';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/create-certificate" element={<CreateCertificatePage />} />
          <Route path="/dashboard/my-groups/:groupId" element={<GroupDetailsPage />} />
          <Route path="/claim/:joinCode" element={<ClaimPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
