import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Authentication Successful",
      description: "Redirecting to secure deal room...",
      className: "bg-card border-primary text-white",
    });
    
    setTimeout(() => {
      setLocation("/dealroom");
    }, 1500);
  };

  return (
    <Layout>
      <div className="min-h-[85vh] flex items-center justify-center bg-background py-32 px-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <span className="font-display font-bold text-4xl tracking-widest text-white mb-2 block">
              PDYE<span className="text-primary">.</span>
            </span>
            <p className="text-white/50 font-sans tracking-wide uppercase text-xs">Secure Client Portal</p>
          </div>

          <div className="bg-card border border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-white/80 text-xs font-bold mb-2 uppercase tracking-wider">Email Address</label>
                <input 
                  {...register("email")}
                  type="email"
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-white/80 text-xs font-bold uppercase tracking-wider">Password</label>
                  <a href="#" className="text-primary hover:text-white text-xs transition-colors">Forgot?</a>
                </div>
                <input 
                  {...register("password")}
                  type="password"
                  className="w-full bg-background border border-white/10 focus:border-primary px-4 py-3 text-white focus:outline-none transition-colors"
                />
                {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-white text-background hover:text-background font-bold uppercase tracking-widest py-4 mt-4 transition-all duration-300 disabled:opacity-50"
              >
                {isSubmitting ? "Authenticating..." : "Access Portal"}
              </button>
            </form>
          </div>
          
          <p className="text-center mt-8 text-white/40 text-sm">
            Not a registered investor? <a href="/access" className="text-primary hover:underline">Request access</a>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
