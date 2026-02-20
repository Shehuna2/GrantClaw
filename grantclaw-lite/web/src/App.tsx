import { Navigate, Route, Routes } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Shell } from "./components/Shell";
import FeedPage from "./pages/FeedPage";
import { GeneratePage } from "./pages/GeneratePage";
import { PreviewPage } from "./pages/PreviewPage";
import { ProposalDetailPage } from "./pages/ProposalDetailPage";
import { SubmitPage } from "./pages/SubmitPage";

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="/generate" element={<GeneratePage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/submit" element={<SubmitPage />} />
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/p/:hash" element={<ProposalDetailPage />} />
      </Routes>
      <SpeedInsights />
    </Shell>
  );
}
