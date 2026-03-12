import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { getPageContent, type PageContent } from "@/lib/content";

const accessSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  company: z.string().min(2, "Company or Investor Type is required"),
  capacity: z.string().min(1, "Please select an investment capacity"),
  message: z.string().optional(),
});

type AccessForm = z.infer<typeof accessSchema>;

export default function Access() {
  const { toast } = useToast();
  const [content, setContent] = useState<PageContent>(getPageContent("access"));
  useEffect(() => { setContent(getPageContent("access")); }, []);
  
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<AccessForm>({
    resolver: zodResolver(accessSchema)
  });

  const onSubmit = async (data: AccessForm) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log(data);
    
    toast({
      title: "Request Received",
      description: "Our team will review your application and contact you shortly.",
      className: "bg-card border-primary text-white",
    });
    
    reset();
  };

  return (
    <Layout>
      <div className="min-h-[90vh] flex">
        {/* Left Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          {/* landing page hero scenic Mediterranean yacht deck luxury */}
          <img 
            src="https://images.unsplash.com/photo-1540946485063-a40da27545f8?w=1200&q=80" 
            alt="Yacht Deck" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background"></div>
        </div>
        
        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 bg-background flex flex-col justify-center px-6 md:px-16 py-32 lg:py-0">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md w-full mx-auto"
          >
            <span className="text-primary font-bold tracking-[0.2em] text-xs uppercase mb-4 block">
              Investor Relations
            </span>
            <h1 className="font-display text-4xl text-white mb-4">{content.heading}</h1>
            <p className="text-white/60 mb-10 font-sans leading-relaxed">{content.subheading}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">Full Name</label>
                <input 
                  {...register("fullName")}
                  className="w-full bg-card border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  placeholder="John Doe"
                />
                {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">Business Email</label>
                <input 
                  {...register("email")}
                  type="email"
                  className="w-full bg-card border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  placeholder="john@example.com"
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">Company / Investor Profile</label>
                <input 
                  {...register("company")}
                  className="w-full bg-card border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                  placeholder="e.g. Family Office, UHNWI, Syndicate"
                />
                {errors.company && <p className="text-destructive text-xs mt-1">{errors.company.message}</p>}
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">Est. Investment Capacity</label>
                <select 
                  {...register("capacity")}
                  className="w-full bg-card border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors appearance-none"
                >
                  <option value="" disabled selected>Select capacity range</option>
                  <option value="1M-5M">€1M - €5M</option>
                  <option value="5M-15M">€5M - €15M</option>
                  <option value="15M-50M">€15M - €50M</option>
                  <option value="50M+">€50M+</option>
                </select>
                {errors.capacity && <p className="text-destructive text-xs mt-1">{errors.capacity.message}</p>}
              </div>
              
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2 uppercase tracking-wide">Message (Optional)</label>
                <textarea 
                  {...register("message")}
                  rows={3}
                  className="w-full bg-card border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors resize-none"
                  placeholder="Specific requirements or interests..."
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest py-4 mt-4 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
              
              <p className="text-white/40 text-xs text-center mt-6">
                All information submitted is kept strictly confidential in accordance with our privacy policy.
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
