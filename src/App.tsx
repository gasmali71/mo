import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemProvider } from '@/contexts/SystemContext';
import { Layout } from './components/layout';
import { AdminGuard } from './components/admin/AdminGuard';
import { Home } from './pages/home';
import { CognitiveTest } from './pages/cognitive-test';
import { Dashboard } from './pages/dashboard';
import { Reports } from './pages/reports';
import { Pricing } from './pages/pricing';
import { EvaluationResults } from './pages/evaluation-results';
import { PaymentSuccess } from './pages/payment/success';
import { PaymentError } from './pages/payment/error';
import { Login } from './pages/auth/login';
import { Signup } from './pages/auth/signup';
import { ResetPassword } from './pages/auth/reset-password';
import { SystemStatus } from './pages/admin/system-status';
import { ClientsAdmin } from './pages/admin/clients';
import { AdminSettings } from './pages/admin/settings';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SystemProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/test" element={<CognitiveTest />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/evaluation-results/:sessionId" element={<EvaluationResults />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/error" element={<PaymentError />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Signup />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Admin Routes */}
              <Route path="/admin/system-status" element={
                <AdminGuard>
                  <SystemStatus />
                </AdminGuard>
              } />
              <Route path="/admin/clients" element={
                <AdminGuard>
                  <ClientsAdmin />
                </AdminGuard>
              } />
              <Route path="/admin/settings" element={
                <AdminGuard>
                  <AdminSettings />
                </AdminGuard>
              } />

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </SystemProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
