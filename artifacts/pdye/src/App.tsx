import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { loadAllCustomFonts } from "@/lib/content";
import { CurrencyProvider } from "@/lib/currency";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Anchor } from "lucide-react";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Yachts from "./pages/Yachts";
import Access from "./pages/Access";
import Private from "./pages/Private";
import Brokers from "./pages/Brokers";
import Login from "./pages/Login";
import DealRoom from "./pages/DealRoom";
import DealDetails from "./pages/DealDetails";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminRequests from "./pages/AdminRequests";
import YachtDetail from "./pages/YachtDetail";
import BoatOwners from "./pages/BoatOwners";
import Investors from "./pages/Investors";
import Valuation from "./pages/Valuation";
import Dashboard from "./pages/Dashboard";
import AddYacht from "./pages/AddYacht";

const queryClient = new QueryClient();

function FontLoader() {
  useEffect(() => { loadAllCustomFonts(); }, []);
  return null;
}

function Spinner() {
  return (
    <div className="min-h-screen bg-[#070f1a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

function UnderReview() {
  const { logout, userProfile } = useAuth();
  return (
    <div className="min-h-screen bg-[#070f1a] flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-10">
          <Anchor size={28} className="text-primary" strokeWidth={2} />
          <span className="font-display font-normal text-3xl tracking-widest text-white">PDYE</span>
        </div>
        <div className="bg-[#0f1d33] border border-white/8 p-10">
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

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType; adminOnly?: boolean }) {
  const { user, userProfile, loading } = useAuth();

  if (loading) return <Spinner />;
  if (!user) return <Redirect to="/login" />;

  const isAdmin = userProfile?.role === "admin";

  if (adminOnly && !isAdmin) return <Redirect to="/" />;
  if (!isAdmin && !userProfile?.approved) return <UnderReview />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/access" component={Access} />
      <Route path="/boat-owners" component={BoatOwners} />
      <Route path="/brokers" component={Brokers} />
      <Route path="/private-buyers" component={Investors} />
      <Route path="/valuation" component={Valuation} />

      {/* Protected */}
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/add-yacht" component={() => <ProtectedRoute component={AddYacht} />} />
      <Route path="/yachts" component={() => <ProtectedRoute component={Yachts} />} />
      <Route path="/yacht/:id" component={() => <ProtectedRoute component={YachtDetail} />} />
      <Route path="/private" component={() => <ProtectedRoute component={Private} />} />
      <Route path="/dealroom" component={() => <ProtectedRoute component={DealRoom} />} />
      <Route path="/dealroom/:id" component={() => <ProtectedRoute component={DealDetails} />} />

      {/* Admin only */}
      <Route path="/admin" component={() => <ProtectedRoute component={Admin} adminOnly />} />
      <Route path="/admin-users" component={() => <ProtectedRoute component={AdminUsers} adminOnly />} />
      <Route path="/admin-requests" component={() => <ProtectedRoute component={AdminRequests} adminOnly />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyProvider>
          <TooltipProvider>
            <FontLoader />
            <WouterRouter hook={useHashLocation}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CurrencyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
