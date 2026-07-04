import { Routes, Route, Navigate } from "react-router-dom";
import RESidebar from "@/components/RESidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import RECommandCenter from "@/pages/RECommandCenter";
import RELeads from "@/pages/RELeads";
import REProperties from "@/pages/REProperties";
import REContentStudio from "@/pages/REContentStudio";
import REReactivation from "@/pages/REReactivation";
import REAppointments from "@/pages/REAppointments";
import REChat from "@/pages/REChat";
import RECampaigns from "@/pages/RECampaigns";
import RECampaignDetail from "@/pages/RECampaignDetail";
import REPipeline from "@/pages/REPipeline";
import REMarketIntel from "@/pages/REMarketIntel";
import Inbox from "@/pages/Inbox";
import Analytics from "@/pages/Analytics";
import Integrations from "@/pages/Integrations";
import Settings from "@/pages/Settings";
import PublicForm from "@/pages/PublicForm";

export default function App() {
  return (
    <>
      <div className="app-bg" />
      <div className="grid-bg" />

      <Routes>
        <Route path="/form/:slug" element={<PublicForm />} />
        <Route path="/*" element={<Shell />} />
      </Routes>
    </>
  );
}

function Shell() {
  return (
    <div className="flex min-h-screen">
      <RESidebar />
      <main className="flex-1 px-8 py-7 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto w-full">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<RECommandCenter />} />
              <Route path="/leads" element={<RELeads />} />
              <Route path="/properties" element={<REProperties />} />
              <Route path="/content" element={<REContentStudio />} />
              <Route path="/reactivation" element={<REReactivation />} />
              <Route path="/appointments" element={<REAppointments />} />
              <Route path="/chat" element={<REChat />} />
              <Route path="/campaigns" element={<RECampaigns />} />
              <Route path="/campaigns/:id" element={<RECampaignDetail />} />
              <Route path="/pipeline" element={<REPipeline />} />
              <Route path="/inbox" element={<Inbox />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/market" element={<REMarketIntel />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
