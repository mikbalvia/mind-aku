import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ModelsPage } from "./pages/ModelsPage";
import { UsagePage } from "./pages/UsagePage";
import { LogsPage } from "./pages/LogsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { SetupPage } from "./pages/SetupPage";
import { PaymentCancelPage, PaymentSuccessPage } from "./pages/PaymentResultPages";
import { HomePage } from "./pages/HomePage";
import { PublicInfoPage } from "./pages/PublicInfoPages";
import { WhatsAppWidget } from "./components/WhatsAppWidget";

export default function App() {
  return (
    <>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/faq" element={<PublicInfoPage page="faq" />} />
      <Route path="/refund-policy" element={<PublicInfoPage page="refund" />} />
      <Route path="/terms-and-conditions" element={<PublicInfoPage page="terms" />} />
      <Route path="/kontak" element={<PublicInfoPage page="contact" />} />
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/cancel" element={<PaymentCancelPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/console" element={<DashboardPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <WhatsAppWidget />
    </>
  );
}
