import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState, lazy, Suspense } from "react";
import { loadAllCustomFonts } from "@/lib/content";
import { loadSiteContentFromServer } from "@/lib/siteContent";
import { CurrencyProvider } from "@/lib/currency";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Anchor } from "lucide-react";
import NotFound from "@/pages/not-found";
import { CookieConsent } from "@/components/CookieConsent";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Access from "./pages/Access";
import Brokers from "./pages/Brokers";
import Investors from "./pages/Investors";
import BoatOwners from "./pages/BoatOwners";

const Yachts = lazy(() => import("./pages/Yachts"));
const YachtDetail = lazy(() => import("./pages/YachtDetail"));
const Valuation = lazy(() => import("./pages/Valuation"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AddYacht = lazy(() => import("./pages/AddYacht"));
const DealRoom = lazy(() => import("./pages/DealRoom"));
const DealDetails = lazy(() => import("./pages/DealDetails"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/AdminUserDetail"));
const AdminRequests = lazy(() => import("./pages/AdminRequests"));
const AdminPlatformNda = lazy(() => import("./pages/AdminPlatformNda"));
const AdminDealNda = lazy(() => import("./pages/AdminDealNda"));
const AdminDealCommission = lazy(() => import("./pages/AdminDealCommission"));
const AdminYachtReview = lazy(() => import("./pages/AdminYachtReview"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminListingsDb = lazy(() => import("./pages/AdminListingsDb"));
const AdminLegalPages = lazy(() => import("./pages/AdminLegalPages"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalNotice = lazy(() => import("./pages/LegalNotice"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const Profile = lazy(() => import("./pages/Profile"));
const PlatformNda = lazy(() => import("./pages/PlatformNda"));

function FontLoader() {
  useEffect(() => { loadAllCustomFonts(); }, []);
  return null;
}

function SiteContentLoader() {
  useEffect(() => { loadSiteContentFromServer(); }, []);
  return null;
}

function Spinner() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function UnderReview() {
  const { logout, userProfile } = useAuth();
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Anchor size={28} className="text-primary" strokeWidth={2} />
          <span className="font-display font-normal text-3xl tracking-widest text-white">PDYE</span>
        </div>
        <div className="bg-white/[0.02] border border-white/8 p-10">
          <div className="w-14 h-14 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <div className="w-6 h-6 border-2 border-primary/60 border-t-primary rounded-full animate-spin" />
          </div>
          <h2 className="font-display text-2xl text-white mb-3">Application Under Review</h2>
          <p className="text-white/50 font-sans text-sm leading-relaxed mb-6">
            Your{" "}
            <span className="text-primary capitalize">{userProfile?.role || "account"}</span>{" "}
            application is being reviewed by our team. You will receive access once approved.
          </p>
          <div className="border-t border-white/5 pt-6 text-white/25 text-xs font-sans tracking-wide">
            Typical review time: 24–48 hours
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-6 text-white/30 hover:text-white/60 text-xs font-sans uppercase tracking-widest transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component, adminOnly = false, skipNdaGate = false }: { component: React.ComponentType; adminOnly?: boolean; skipNdaGate?: boolean }) {
  const { user, userProfile, ndaStatus, loading, refreshProfile } = useAuth();
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (!loading && user && userProfile === null && !retried) {
      setRetried(true);
      refreshProfile();
    }
  }, [loading, user, userProfile, retried, refreshProfile]);

  if (loading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;
  if (userProfile === null) return <Spinner />;

  const isAdmin = userProfile.role === "admin";

  if (adminOnly && !isAdmin) return <Redirect to="/" />;
  if (!isAdmin && !userProfile.approved) return <UnderReview />;

  // Platform CNCA gate — non-admin users must have signed before reaching any protected page
  if (!isAdmin && !skipNdaGate) {
    if (ndaStatus === null) return <Spinner />;
    if (!ndaStatus.signed) return <Redirect to="/platform-nda" />;
  }

  return <Component />;
}

// Public showcase route: lets non-authenticated visitors view the page
// (used by /yachts marketing showcase). For logged-in users, applies the
// same approval and CNCA checks as ProtectedRoute so existing gates keep
// working.
function OptionalProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, userProfile, ndaStatus, loading, refreshProfile } = useAuth();
  const [retried, setRetried] = useState(false);

  useEffect(() => {
    if (!loading && user && userProfile === null && !retried) {
      setRetried(true);
      refreshProfile();
    }
  }, [loading, user, userProfile, retried, refreshProfile]);

  if (loading) return <Spinner />;
  if (!user) return <Component />;
  if (userProfile === null) return <Spinner />;

  const isAdmin = userProfile.role === "admin";
  if (!isAdmin && !userProfile.approved) return <UnderReview />;
  if (!isAdmin) {
    if (ndaStatus === null) return <Spinner />;
    if (!ndaStatus.signed) return <Redirect to="/platform-nda" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<Spinner />}>
      <Switch>
        {/* Public */}
        <Route path="/" component={Home} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/access" component={Access} />
        <Route path="/boat-owners" component={BoatOwners} />
        <Route path="/brokers" component={Brokers} />
        <Route path="/private-buyers" component={Investors} />
        <Route path="/valuation" component={Valuation} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/legal-notice" component={LegalNotice} />
        <Route path="/cookie-policy" component={CookiePolicy} />

        {/* Platform CNCA — auth required but bypasses CNCA gate (otherwise infinite redirect) */}
        <Route path="/platform-nda" component={() => <ProtectedRoute component={PlatformNda} skipNdaGate />} />

        {/* Protected */}
        <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/profile" component={() => <ProtectedRoute component={Profile} />} />
        <Route path="/add-yacht" component={() => <ProtectedRoute component={AddYacht} />} />
        <Route path="/yachts" component={() => <OptionalProtectedRoute component={Yachts} />} />
        <Route path="/yacht/:id" component={() => <ProtectedRoute component={YachtDetail} />} />
        <Route path="/dealroom" component={() => <ProtectedRoute component={DealRoom} />} />
        <Route path="/dealroom/:id" component={() => <ProtectedRoute component={DealDetails} />} />

        {/* Admin only */}
        <Route path="/admin" component={() => <ProtectedRoute component={Admin} adminOnly />} />
        <Route path="/admin-users" component={() => <ProtectedRoute component={AdminUsers} adminOnly />} />
        <Route path="/admin/users/:id" component={() => <ProtectedRoute component={AdminUserDetail} adminOnly />} />
        <Route path="/admin-requests" component={() => <ProtectedRoute component={AdminRequests} adminOnly />} />
        <Route path="/admin-platform-nda" component={() => <ProtectedRoute component={AdminPlatformNda} adminOnly />} />
        <Route path="/admin-deal-nda" component={() => <ProtectedRoute component={AdminDealNda} adminOnly />} />
        <Route path="/admin-deal-commission" component={() => <ProtectedRoute component={AdminDealCommission} adminOnly />} />
        <Route path="/admin-legal" component={() => <ProtectedRoute component={AdminLegalPages} adminOnly />} />
        <Route path="/admin/yachts/:id" component={() => <ProtectedRoute component={AdminYachtReview} adminOnly />} />
        <Route path="/admin/analytics" component={() => <ProtectedRoute component={AdminAnalytics} adminOnly />} />
        <Route path="/admin/listings-db" component={() => <ProtectedRoute component={AdminListingsDb} adminOnly />} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <FontLoader />
          <SiteContentLoader />
          <WouterRouter>
            <Router />
          </WouterRouter>
          <Toaster />
          <CookieConsent />
        </TooltipProvider>
      </CurrencyProvider>
    </AuthProvider>
  );
}

export default App;
