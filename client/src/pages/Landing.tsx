import { Button } from "@/components/ui/button";
import { ShieldCheck, PieChart, Lock } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
              <ShieldCheck className="w-6 h-6" />
              <span>Prosper</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-register">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight tracking-tight text-foreground">
              Secure Your Future, <br/>
              <span className="text-primary">Track Your Wealth</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
              The intelligent way to manage your insurance policies and investments in one secure place. Never miss a renewal again.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" data-testid="button-hero-register">
                  Get Started
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-lg" data-testid="button-hero-login">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl shadow-blue-900/10 border border-border/50 animate-in delay-100 hidden lg:block bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 p-8">
            {/* Abstract UI Mockup */}
            <div className="w-full h-full bg-card rounded-2xl shadow-lg border border-border/50 p-6 flex flex-col gap-6 opacity-90 hover:scale-[1.02] transition-transform duration-500">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-muted rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-primary/20 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-32 bg-blue-500/10 rounded-xl border border-blue-500/20 p-4">
                  <div className="h-8 w-8 bg-blue-500/20 rounded-lg mb-4"></div>
                  <div className="h-4 w-16 bg-muted rounded mb-2"></div>
                  <div className="h-6 w-24 bg-foreground/10 rounded"></div>
                </div>
                <div className="h-32 bg-green-500/10 rounded-xl border border-green-500/20 p-4">
                  <div className="h-8 w-8 bg-green-500/20 rounded-lg mb-4"></div>
                  <div className="h-4 w-16 bg-muted rounded mb-2"></div>
                  <div className="h-6 w-24 bg-foreground/10 rounded"></div>
                </div>
              </div>
              <div className="flex-1 bg-muted/50 rounded-xl p-4 space-y-3">
                 <div className="h-4 w-full bg-card rounded"></div>
                 <div className="h-4 w-3/4 bg-card rounded"></div>
                 <div className="h-4 w-5/6 bg-card rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-muted/50 border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">Everything you need to manage assets</h2>
            <p className="text-muted-foreground">Simple, secure, and smart features designed for modern financial tracking.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Policy Tracking",
                description: "Keep all your insurance policies in one place. Get notified before they expire."
              },
              {
                icon: PieChart,
                title: "Investment Portfolio",
                description: "Track stocks, mutual funds, and assets across different platforms and currencies."
              },
              {
                icon: Lock,
                title: "Bank-Grade Security",
                description: "Your data is encrypted and secure. We prioritize your privacy above all else."
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-card p-8 rounded-2xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all duration-300 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
