import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Home from "./pages/Home";
import Yachts from "./pages/Yachts";
import Access from "./pages/Access";
import Private from "./pages/Private";
import Brokers from "./pages/Brokers";
import Login from "./pages/Login";
import DealRoom from "./pages/DealRoom";

const queryClient = new QueryClient();

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
