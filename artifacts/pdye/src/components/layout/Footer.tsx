import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#050a14] pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <span className="font-display font-normal text-3xl tracking-widest text-white block mb-6">
              P<span className="text-primary">.</span>D<span className="text-primary">.</span>Y<span className="text-primary">.</span>E<span className="text-primary">.</span>
            </span>
            <p className="text-white/60 max-w-sm font-sans leading-relaxed">
              The premier private marketplace for distressed and off-market Mediterranean yacht opportunities. Confidential brokerage for qualified investors.
            </p>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-6 text-white tracking-wide">Marketplace</h4>
            <ul className="space-y-4 font-sans">
              <li><Link href="/yachts" className="text-white/60 hover:text-primary transition-colors">Available Yachts</Link></li>
              <li><Link href="/private" className="text-white/60 hover:text-primary transition-colors">Private Deals</Link></li>
              <li><Link href="/brokers" className="text-white/60 hover:text-primary transition-colors">For Brokers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-6 text-white tracking-wide">Client Services</h4>
            <ul className="space-y-4 font-sans">
              <li><Link href="/access" className="text-white/60 hover:text-primary transition-colors">Request Access</Link></li>
              <li><Link href="/dealroom" className="text-white/60 hover:text-primary transition-colors">Deal Room</Link></li>
              <li><Link href="/login" className="text-white/60 hover:text-primary transition-colors">Client Login</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm font-sans">
            &copy; {new Date().getFullYear()} Private Distressed Yacht Exchange. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Confidentiality Agreement</a>
            <Link href="/admin" className="hover:text-white/60 transition-colors opacity-20 hover:opacity-60">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
