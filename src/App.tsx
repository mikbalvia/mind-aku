import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ChatPage } from "./pages/ChatPage";
import { ModelsPage } from "./pages/ModelsPage";
import { UsagePage } from "./pages/UsagePage";
import { LogsPage } from "./pages/LogsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { ForbiddenPage } from "./pages/ForbiddenPage";
import { SetupPage } from "./pages/SetupPage";
import { SampleApiPage } from "./pages/SampleApiPage";
import { AffiliatePage } from "./pages/AffiliatePage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { AdminWithdrawalsPage } from "./pages/AdminWithdrawalsPage";
import { PaymentCancelPage, PaymentSuccessPage } from "./pages/PaymentResultPages";
import { BuyPage } from "./pages/BuyPage";
import { BuyCancelPage, BuySuccessPage } from "./pages/BuyResultPages";
import { HomePage } from "./pages/HomePage";
import { PublicInfoPage } from "./pages/PublicInfoPages";
import { WhatsAppWidget } from "./components/WhatsAppWidget";
import { SUBSCRIPTION_PAGE_ENABLED } from "./config";

export default function App() {
  return (
    <>
      <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/beli" element={<BuyPage />} />
      <Route path="/beli/success" element={<BuySuccessPage />} />
      <Route path="/beli/cancel" element={<BuyCancelPage />} />
      <Route path="/faq" element={<PublicInfoPage page="faq" />} />
      <Route path="/refund-policy" element={<PublicInfoPage page="refund" />} />
      <Route path="/terms-and-conditions" element={<PublicInfoPage page="terms" />} />
      <Route path="/kontak" element={<PublicInfoPage page="contact" />} />
      <Route path="/payments/success" element={<PaymentSuccessPage />} />
      <Route path="/payments/cancel" element={<PaymentCancelPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/withdrawals" element={<AdminWithdrawalsPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/console" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/sample-api" element={<SampleApiPage />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/usage" element={<UsagePage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route
          path="/subscription"
          element={
            SUBSCRIPTION_PAGE_ENABLED ? (
              <SubscriptionPage />
            ) : (
              <ForbiddenPage />
            )
          }
        />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <WhatsAppWidget />
    </>
  );
}
