import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicNavbar from './components/layout/PublicNavbar';
import Landing from './pages/public/Landing';
import About from './pages/public/About';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import Emergency from './pages/public/Emergency';
import Login from './pages/auth/Login';
import PatientDashboard from './pages/patient/Dashboard';
import MyBookings from './pages/patient/MyBookings';
import PatientPrescriptions from './pages/patient/Prescriptions';
import UnifiedBookingHub from './pages/patient/UnifiedBookingHub';
import BloodBank from './pages/public/BloodBank';
import TokenTracker from './pages/patient/TokenTracker';
import PatientProfile from './pages/patient/Profile';
import PatientReviews from './pages/patient/Reviews';
import HospitalDashboard from './pages/hospital/Dashboard';
import HospitalDoctors from './pages/hospital/Doctors';
import HospitalAppointments from './pages/hospital/Appointments';
import HospitalOfflineBooking from './pages/hospital/OfflineBooking';
import HospitalFacilities from './pages/hospital/Facilities';
import HospitalProfile from './pages/hospital/Profile';
import DoctorDashboard from './pages/doctor/Dashboard';
import HospitalDetails from './pages/public/HospitalDetails';
import FindDoctors from './pages/public/FindDoctors';
import FindHospitals from './pages/public/FindHospitals';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorAvailability from './pages/doctor/Availability';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorProfile from './pages/doctor/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import Registrations from './pages/admin/Registrations';
import AdminHospitals from './pages/admin/Hospitals';
import AdminRevenue from './pages/admin/Revenue';
import AdminDoctors from './pages/admin/Doctors';
import AdminPatients from './pages/admin/Patients';
import AdminBloodBank from './pages/admin/BloodBank';
import AdminProfile from './pages/admin/Profile';
import DoctorConsultation from './pages/consultation/DoctorConsultation';
import ConsultationRoom from './pages/consultation/ConsultationRoom';
import Signup from './pages/auth/Signup';
import DoctorSignup from './pages/auth/DoctorSignup';
import HospitalSignup from './pages/auth/HospitalSignup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyOtp from './pages/auth/VerifyOtp';
import ChangePassword from './pages/auth/ChangePassword';
import PrivacyPolicy from './pages/public/PrivacyPolicy';
import TermsOfService from './pages/public/TermsOfService';
import NotFound from './pages/shared/NotFound';
import Notifications from './pages/notifications/Notifications';
import Settings from './pages/shared/Settings';
import { ROUTES } from './constants/routes';
import PrivateRoute from './components/auth/PrivateRoute';
import useAuthStore from './store/authStore';
import useUiStore from './store/uiStore';
import { Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/shared/ErrorBoundary';
import authService from './services/authService';

const DashboardRedirect = () => {
  const { role } = useAuthStore();
  
  const dashboardMap = {
    patient: ROUTES.PATIENT.DASHBOARD,
    hospital: ROUTES.HOSPITAL.DASHBOARD,
    doctor: ROUTES.DOCTOR.DASHBOARD,
    admin: ROUTES.ADMIN.DASHBOARD
  };

  // Temporarily defaulting to patient dashboard if no role is found
  return <Navigate to={dashboardMap[role] || ROUTES.PATIENT.DASHBOARD} replace />;
};

function App() {
  const { login, setLoading, loading } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      // Check if this tab has an active role (sessionStorage is per-tab)
      const activeRole = sessionStorage.getItem('medcare_active_role');
      const hasToken = activeRole
        ? !!localStorage.getItem(`medcare_token_${activeRole}`)
        : ['patient', 'doctor', 'hospital', 'admin'].some(r => !!localStorage.getItem(`medcare_token_${r}`));

      if (!hasToken) {
        // No token at all, skip the API call
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.getCurrentUser('me');
        // Restore the active role in sessionStorage if it was lost (e.g., new tab with shared localStorage)
        if (!activeRole && userData.role) {
          sessionStorage.setItem('medcare_active_role', userData.role);
        }
        login(userData);
      } catch (err) {
        // No active session, clear stale data
        console.error('Session restore failed:', err);
        setLoading(false);
      }
    };
    checkAuth();
  }, [login, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E1F2F1]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#0D9488]"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-white flex flex-col transition-colors duration-300">
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'border font-bold text-sm rounded-2xl p-4 shadow-2xl',
              duration: 4000
            }} 
          />
          <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.HOME} element={<><PublicNavbar /><Landing /></>} />
          <Route path={ROUTES.ABOUT} element={<><PublicNavbar /><About /></>} />
          <Route path={ROUTES.SERVICES} element={<><PublicNavbar /><Services /></>} />
          <Route path="/contact" element={<><PublicNavbar /><Contact /></>} />
          <Route path={ROUTES.FIND_DOCTORS} element={<><PublicNavbar /><FindDoctors /></>} />
          <Route path={ROUTES.FIND_HOSPITALS} element={<><PublicNavbar /><FindHospitals /></>} />
          <Route path={ROUTES.EMERGENCY} element={<Emergency />} />
          <Route path={ROUTES.PUBLIC_HOSPITAL} element={<HospitalDetails />} />
          
          {/* Authentication Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<Signup />} />
          <Route path={ROUTES.SIGNUP_DOCTOR} element={<DoctorSignup />} />
          <Route path={ROUTES.SIGNUP_HOSPITAL} element={<HospitalSignup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
          <Route path={ROUTES.PRIVACY} element={<PrivacyPolicy />} />
          <Route path={ROUTES.TERMS} element={<TermsOfService />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/blood-bank" element={<BloodBank />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardRedirect />} />
            
          {/* Patient Protected Routes */}
          <Route path="/patient/*" element={
            <PrivateRoute allowedRoles={['patient']}>
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="appointments" element={<MyBookings />} />
                <Route path="prescriptions" element={<PatientPrescriptions />} />
                <Route path="book-appointment" element={<UnifiedBookingHub />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="tracker" element={<TokenTracker />} />
                <Route path="reviews/:id" element={<PatientReviews />} />
                {/* Unified Patient sub-routes */}
                <Route path="consultation/room/:sessionId" element={<ConsultationRoom />} />
              </Routes>
            </PrivateRoute>
          } />

          {/* Removed shared consultation block */}

          {/* Hospital Protected Routes */}
          <Route path="/hospital/*" element={
            <PrivateRoute allowedRoles={['hospital']}>
              <Routes>
                <Route path="dashboard" element={<HospitalDashboard />} />
                <Route path="doctors" element={<HospitalDoctors />} />
                <Route path="appointments" element={<HospitalAppointments />} />
                <Route path="offline-booking" element={<HospitalOfflineBooking />} />
                <Route path="facilities" element={<HospitalFacilities />} />
                <Route path="profile" element={<HospitalProfile />} />
              </Routes>
            </PrivateRoute>
          } />

          {/* Doctor Protected Routes */}
          <Route path="/doctor/*" element={
            <PrivateRoute allowedRoles={['doctor']}>
              <Routes>
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="availability" element={<DoctorAvailability />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
                <Route path="profile" element={<DoctorProfile />} />
                {/* Doctor Consultation Sub-routes */}
                <Route path="consultation/sessions" element={<DoctorConsultation />} />
                <Route path="consultation/room/:sessionId" element={<ConsultationRoom />} />
              </Routes>
            </PrivateRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['admin']}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="registrations" element={<Registrations />} />
                <Route path="hospitals" element={<AdminHospitals />} />
                <Route path="revenue" element={<AdminRevenue />} />
                <Route path="doctors" element={<AdminDoctors />} />
                <Route path="patients" element={<AdminPatients />} />
                <Route path="blood-bank" element={<AdminBloodBank />} />
                <Route path="profile" element={<AdminProfile />} />
              </Routes>
            </PrivateRoute>
          } />

          {/* Shared Protected Routes */}
          <Route path="/settings" element={<PrivateRoute allowedRoles={['patient', 'doctor', 'hospital', 'admin']}><Settings /></PrivateRoute>} />
          <Route path={ROUTES.NOTIFICATIONS} element={<PrivateRoute allowedRoles={['patient', 'doctor', 'hospital', 'admin']}><Notifications /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
