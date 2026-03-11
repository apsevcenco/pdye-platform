import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Download, FileText, Activity, ShieldCheck, AlertCircle } from "lucide-react";
import { FEATURED_YACHTS } from "@/lib/data";

export default function DealRoom() {
  const activeDeal = FEATURED_YACHTS[0]; // Just picking one to mock the deal room

  const documents = [
    { id: 1, name: "General Arrangement & Specs", type: "PDF", size: "2.4 MB", icon: FileText },
    { id: 2, name: "Recent Condition Survey (2023)", type: "PDF", size: "14.1 MB", icon: Activity },
    { id: 3, name: "Registration & Title Docs", type: "ZIP", size: "5.2 MB", icon: ShieldCheck },
    { id: 4, name: "Terms of Sale / NDA", type: "PDF", size: "1.1 MB", icon: AlertCircle },
  ];

  const handleDownload = (docName: string) => {
    // Mock download
    alert(`Initiating secure download: ${docName}`);
  };

  return (
    <Layout>
      <div className="pt-32 pb-12 bg-secondary border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-2 block">
              Virtual Data Room
            </span>
            <h1 className="font-display text-4xl text-white">Project: {activeDeal.name}</h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card px-6 py-3 border border-white/10"
          >
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Status</p>
            <p className="text-white font-bold">{activeDeal.status}</p>
          </motion.div>
        </div>
      </div>

      <section className="py-12 bg-background min-h-[60vh]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-12">
          
          {/* Main Content - Doc List */}
          <div className="w-full lg:w-2/3">
            <h2 className="font-display text-2xl text-white mb-6">Due Diligence Documents</h2>
            
            <div className="bg-card border border-white/5 flex flex-col">
              {documents.map((doc, idx) => (
                <motion.div 
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-6 border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-background flex items-center justify-center border border-white/10 text-primary">
                      <doc.icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-white font-medium font-sans group-hover:text-primary transition-colors">{doc.name}</h4>
                      <p className="text-white/40 text-xs uppercase tracking-wider mt-1">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDownload(doc.name)}
                    className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:bg-primary hover:text-background hover:border-primary transition-all duration-300"
                  >
                    <Download size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
            
            <div className="mt-8 bg-primary/10 border border-primary/20 p-6">
              <h4 className="text-primary font-bold uppercase tracking-wider text-sm mb-2">Confidentiality Notice</h4>
              <p className="text-white/60 text-sm leading-relaxed">
                All documents contained within this virtual data room are strictly confidential and subject to the Non-Disclosure Agreement executed prior to access. Unauthorized distribution is prohibited.
              </p>
            </div>
          </div>
          
          {/* Sidebar - Asset Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-card border border-white/5 sticky top-32">
              <div className="aspect-[4/3] relative">
                <img src={activeDeal.image} alt={activeDeal.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-background/20"></div>
              </div>
              <div className="p-8">
                <h3 className="font-display text-2xl text-white mb-6">Asset Summary</h3>
                
                <div className="space-y-4 font-sans text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Builder</span>
                    <span className="text-white font-medium">{activeDeal.builder}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Year</span>
                    <span className="text-white font-medium">{activeDeal.year}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Length</span>
                    <span className="text-white font-medium">{activeDeal.length}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Location</span>
                    <span className="text-white font-medium">{activeDeal.location}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-white/50">Guideline Price</span>
                    <span className="text-primary font-bold">{activeDeal.price}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => alert("Connecting to assigned broker...")}
                  className="w-full bg-transparent border border-primary text-primary hover:bg-primary hover:text-background font-bold uppercase tracking-widest py-4 mt-8 transition-all duration-300 text-xs"
                >
                  Contact Broker
                </button>
              </div>
            </div>
          </div>
          
        </div>
      </section>
    </Layout>
  );
}
