import { Link } from "wouter";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { getSiteSectionData } from "@/lib/siteContent";

export function Footer() {
  const brand = getSiteSectionData("footer", "brand");
  const contact = getSiteSectionData("footer", "contact");
  const legal = getSiteSectionData("footer", "legal");

  const rows = [
    contact.email && { icon: Mail, label: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, "")}` },
    contact.whatsapp && { icon: MessageCircle, label: contact.whatsapp, href: contact.whatsapp.startsWith("http") ? contact.whatsapp : `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}` },
    contact.address && { icon: MapPin, label: contact.address, href: null },
    contact.hours && { icon: Clock, label: contact.hours, href: null },
  ].filter(Boolean) as { icon: any; label: string; href: string | null }[];

  return (
    <footer className="bg-[#06101e] pt-20 pb-10 border-t border-[#f4ecd8]/10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-5">
            <span
              className="font-display font-normal text-3xl tracking-widest text-[#f4ecd8] block mb-6"
              dangerouslySetInnerHTML={{ __html: brand.name }}
            />
            <p
              className="text-[#f4ecd8]/55 max-w-sm font-sans leading-relaxed"
              dangerouslySetInnerHTML={{ __html: brand.desc }}
            />
          </div>

          <div className="md:col-span-7">
            <span className="block text-primary text-[10px] font-bold tracking-[0.25em] uppercase mb-3" dangerouslySetInnerHTML={{ __html: contact.tag || "Contact" }} />
            <h4
              className="font-display text-2xl mb-3 text-[#f4ecd8] tracking-wide"
              dangerouslySetInnerHTML={{ __html: contact.title || "Contact Us" }}
            />
            {contact.intro && (
              <p
                className="text-[#f4ecd8]/55 font-sans text-sm leading-relaxed max-w-md mb-6"
                dangerouslySetInnerHTML={{ __html: contact.intro }}
              />
            )}
            <ul className="space-y-3 font-sans">
              {rows.map((r, i) => {
                const Icon = r.icon;
                const inner = (
                  <span className="flex items-start gap-3 text-[#f4ecd8]/75 hover:text-primary transition-colors text-sm leading-relaxed">
                    <Icon size={15} strokeWidth={1.5} className="text-primary mt-[3px] flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: r.label }} />
                  </span>
                );
                return (
                  <li key={i}>
                    {r.href ? (
                      <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel={r.href.startsWith("http") ? "noopener noreferrer" : undefined}>
                        {inner}
                      </a>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#f4ecd8]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#f4ecd8]/45 text-sm font-sans">
            &copy; {new Date().getFullYear()} {legal.copyright}
          </p>
          <div className="flex gap-6 text-sm text-[#f4ecd8]/45">
            <Link href="/privacy-policy" className="hover:text-[#f4ecd8] transition-colors">{legal.privacy || "Privacy Policy"}</Link>
            <Link href="/legal-notice" className="hover:text-[#f4ecd8] transition-colors">Legal Notice</Link>
            <Link href="/admin" className="hover:text-[#f4ecd8]/70 transition-colors opacity-20 hover:opacity-60">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
