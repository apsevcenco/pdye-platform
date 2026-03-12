import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

const brokerSchema = z.object({
  yachtName: z.string().min(1, "Yacht name is required"),
  length: z.string().min(1, "Length is required"),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 2),
  location: z.string().min(1, "Location is required"),
  price: z.string().min(1, "Price is required"),
  brokerName: z.string().min(1, "Your name is required"),
});

type BrokerForm = z.infer<typeof brokerSchema>;

export default function Brokers() {
  const { toast } = useToast();
  const [content, setContent] = useState<PageContent>(getPageContent("brokers"));
  useEffect(() => { setContent(getPageContent("brokers")); }, []);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<BrokerForm>({
    resolver: zodResolver(brokerSchema)
  });

  const onSubmit = async (data: BrokerForm) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Listing Submitted",
      description: "Our acquisitions team will review the asset and contact you.",
      className: "bg-card border-primary text-white",
    });
    
    reset();
  };

  return (
    <Layout>
      <div className="pt-32 pb-16 bg-secondary border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-4 block">
              Broker Portal
            </span>
            <h1 className="font-display text-4xl md:text-5xl text-white mb-6" dangerouslySetInnerHTML={{ __html: content.heading }} />
            <p className="text-white/60 font-sans text-lg" dangerouslySetInnerHTML={{ __html: content.subheading }} />
          </motion.div>
        </div>
      </div>

      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-card p-8 md:p-12 border border-white/5 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Yacht Name / Project</label>
                  <input 
                    {...register("yachtName")}
                    className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  />
                  {errors.yachtName && <p className="text-destructive text-xs mt-1">{errors.yachtName.message}</p>}
                </div>
                <div>
                  <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Length (LOA)</label>
                  <input 
                    {...register("length")}
                    className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                    placeholder="e.g. 45m"
                  />
                  {errors.length && <p className="text-destructive text-xs mt-1">{errors.length.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Build Year</label>
                  <input 
                    {...register("year")}
                    type="number"
                    className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  />
                  {errors.year && <p className="text-destructive text-xs mt-1">{errors.year.message}</p>}
                </div>
                <div>
                  <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Current Location</label>
                  <input 
                    {...register("location")}
                    className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  />
                  {errors.location && <p className="text-destructive text-xs mt-1">{errors.location.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Asking Price / Guidelines</label>
                <input 
                  {...register("price")}
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  placeholder="e.g. € 12,000,000 or Price on Application"
                />
                {errors.price && <p className="text-destructive text-xs mt-1">{errors.price.message}</p>}
              </div>
              
              <hr className="border-white/10 my-8" />

              <div>
                <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Broker Name</label>
                <input 
                  {...register("brokerName")}
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                />
                {errors.brokerName && <p className="text-destructive text-xs mt-1">{errors.brokerName.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest py-4 mt-8 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Submit Listing"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
