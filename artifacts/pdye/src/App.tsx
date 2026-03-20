import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { loadAllCustomFonts } from "@/lib/content";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Yachts from "./pages/Yachts";
import Access from "./pages/Access";
import Private from "./pages/Private";
import Brokers from "./pages/Brokers";
import Login from "./pages/Login";
import DealRoom from "./pages/DealRoom";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

function FontLoader() {
  useEffect(() => { loadAllCustomFonts(); }, []);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/yachts" component={Yachts} />
      <Route path="/access" component={Access} />
      <Route path="/private" component={Private} />
      <Route path="/brokers" component={Brokers} />
      <Route path="/login" component={Login} />
      <Route path="/dealroom" component={DealRoom} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <FontLoader />
        <WouterRouter hook={useHashLocation}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
