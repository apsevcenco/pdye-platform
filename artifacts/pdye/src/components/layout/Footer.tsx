import { Link } from "wouter";
import { getSiteSectionData } from "@/lib/siteContent";

export function Footer() {
  const brand = getSiteSectionData("footer", "brand");
  const marketplace = getSiteSectionData("footer", "marketplace");
  const services = getSiteSectionData("footer", "services");
  const legal = getSiteSectionData("footer", "legal");

  return (
    <footer className="bg-[#050a14] pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <span className="font-display font-normal text-3xl tracking-widest text-white block mb-6" dangerouslySetInnerHTML={{ __html: brand.name }} />
            <p className="text-white/60 max-w-sm font-sans leading-relaxed" dangerouslySetInnerHTML={{ __html: brand.desc }} />
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-6 text-white tracking-wide" dangerouslySetInnerHTML={{ __html: marketplace.title }} />
            <ul className="space-y-4 font-sans">
              <li><Link href="/yachts" className="text-white/60 hover:text-primary transition-colors">{marketplace.link1}</Link></li>
              <li><Link href="/brokers" className="text-white/60 hover:text-primary transition-colors">{marketplace.link2}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-display text-lg mb-6 text-white tracking-wide" dangerouslySetInnerHTML={{ __html: services.title }} />
            <ul className="space-y-4 font-sans">
              <li><Link href="/access" className="text-white/60 hover:text-primary transition-colors">{services.link1}</Link></li>
              <li><Link href="/dealroom" className="text-white/60 hover:text-primary transition-colors">{services.link2}</Link></li>
              <li><Link href="/login" className="text-white/60 hover:text-primary transition-colors">{services.link3}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm font-sans">
            &copy; {new Date().getFullYear()} {legal.copyright}
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white transition-colors">{legal.privacy}</a>
            <a href="#" className="hover:text-white transition-colors">{legal.terms}</a>
            <a href="#" className="hover:text-white transition-colors">{legal.confidentiality}</a>
            <Link href="/admin" className="hover:text-white/60 transition-colors opacity-20 hover:opacity-60">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
