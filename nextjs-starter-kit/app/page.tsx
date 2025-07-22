"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
// Using React Icons as fallback due to lucide-react build issues
import { 
  FaArrowRight as ArrowRight,
  FaCheck as CheckCircle,
  FaDollarSign as DollarSign,
  FaShield as Shield,
  FaChartLine as TrendingUp,
  FaUsers as Users,
  FaComments as MessageSquare,
  FaDatabase as Database,
  FaLinkedin as Linkedin,
  FaStar as Star,
  FaGlobe as Globe,
  FaChevronRight as ChevronRight
} from "react-icons/fa6";
import { RiSparklingFill as Sparkles } from "react-icons/ri";
import Link from "next/link";

// Components
const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const ParallaxElement = ({ 
  children, 
  offset = -100, 
  className = "" 
}: { 
  children: React.ReactNode, 
  offset?: number, 
  className?: string 
}) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, offset]);
  
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
};

export default function LangSetHomepage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWaitlistSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    try {
      // Use Better Auth Generic OAuth method for LinkedIn
      const response = await fetch('/api/auth/sign-in/oauth2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: 'linkedin',
          callbackURL: '/'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        console.error('Failed to initiate LinkedIn OAuth');
      }
    } catch (error) {
      console.error('LinkedIn OAuth error:', error);
    }
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen">
      {/* JavaScript Notice */}
      <noscript>
        <div className="bg-destructive text-destructive-foreground p-4 text-center">
          <strong>We&apos;re sorry but LangSet.ai doesn&apos;t work properly without JavaScript enabled. Please enable it to continue.</strong>
        </div>
      </noscript>

      {/* Header */}
      <header className={`navbar fixed top-0 w-full z-50 ${scrolled ? 'scrolled' : ''}`}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Database className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-white">LangSet.ai</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-white hover:text-primary transition-colors font-medium border-b-2 border-primary">Home</a>
            <a href="#how-it-works" className="text-white/80 hover:text-primary transition-colors font-medium">How It Works</a>
            <a href="#about" className="text-white/80 hover:text-primary transition-colors font-medium">About</a>
            <a href="#blog" className="text-white/80 hover:text-primary transition-colors font-medium">Blog</a>
          </nav>

          {/* CTA Button */}
          <Button 
            onClick={() => handleWaitlistSignup({ preventDefault: () => {} } as React.FormEvent)}
            className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 hover:scale-105"
          >
            <span>Join Waitlist</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-card overflow-hidden">
        {/* Parallax Background Elements */}
        <ParallaxElement offset={-50} className="absolute top-20 right-20 opacity-60">
          <div className="w-32 h-32 bg-primary/20 rounded-full blur-3xl parallax-float"></div>
        </ParallaxElement>
        <ParallaxElement offset={-100} className="absolute bottom-40 left-20 opacity-40">
          <div className="w-48 h-48 bg-accent/30 rounded-full blur-2xl parallax-float" style={{ animationDelay: '2s' }}></div>
        </ParallaxElement>
        <ParallaxElement offset={-150} className="absolute top-1/2 left-1/4 opacity-30">
          <MessageSquare className="h-24 w-24 text-primary/50 parallax-float" style={{ animationDelay: '4s' }} />
        </ParallaxElement>

        <div className="container mx-auto px-4 text-center relative z-10">
          <AnimatedSection>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
              LangSet.ai: Language → Datasets
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Empower Your Skills in the AI Era
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection className="max-w-4xl mx-auto">
            <p className="text-xl text-white/80 mb-12 leading-relaxed">
              Turn your knowledge into owned, sellable datasets with AI-guided interviews. 
              Monetize ethically, reclaim control from AI disruption, and profit from what you&apos;ve built.
            </p>
          </AnimatedSection>

          <AnimatedSection>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="slide-in"
            >
              <Button 
                onClick={() => handleWaitlistSignup({ preventDefault: () => {} } as React.FormEvent)}
                size="lg"
                className="bg-primary hover:bg-primary/80 text-white px-12 py-6 text-xl rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <span>Join the Waitlist</span>
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </motion.div>
          </AnimatedSection>

          {/* Floating Visual Elements */}
          <div className="relative mt-20">
            <ParallaxElement offset={-80} className="absolute -top-10 left-1/4">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-xl highlight">
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold text-card-foreground">AI Interview</span>
                </div>
                <p className="text-xs text-muted-foreground">Extracting expertise...</p>
                <div className="w-16 h-1 bg-primary/30 rounded-full mt-2">
                  <div className="w-12 h-full bg-primary rounded-full"></div>
                </div>
              </div>
            </ParallaxElement>
            
            <ParallaxElement offset={-120} className="absolute top-10 right-1/4">
              <div className="bg-card/90 backdrop-blur-sm rounded-xl p-4 shadow-xl highlight">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-accent" />
                  <span className="text-sm font-semibold text-card-foreground">Earnings</span>
                </div>
                <p className="text-lg font-bold text-accent">$2,847</p>
                <p className="text-xs text-muted-foreground">90% yours</p>
              </div>
            </ParallaxElement>
          </div>
        </div>
      </section>

      {/* Problem-Solution Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-card-foreground text-center mb-16">
              AI is Disrupting Jobs – But You Can Own the Data Driving It
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-destructive">
                <div className="text-center">
                  <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">⚠️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-destructive mb-4">The Problem</h3>
                  <ul className="text-left space-y-3 text-card-foreground">
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
                      <span><strong>85 million jobs at risk by 2025</strong> (World Economic Forum)</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
                      <span>Your expertise harvested without compensation</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-destructive rounded-full mt-2"></div>
                      <span>Zero control over AI using your knowledge</span>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-destructive/5 rounded-lg">
                    <div className="text-3xl font-bold text-destructive">$0</div>
                    <div className="text-sm text-muted-foreground">What you earn from AI using your knowledge</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection>
              <div className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-l-4 border-primary">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-primary mb-4">The Solution</h3>
                  <ul className="text-left space-y-3 text-card-foreground">
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-1" />
                      <span>Create high-quality datasets from your skills</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-1" />
                      <span>Sell on your terms with full ownership</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <CheckCircle className="h-5 w-5 text-primary mt-1" />
                      <span>Keep 90% of all earnings</span>
                    </li>
                  </ul>
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">90%</div>
                    <div className="text-sm text-muted-foreground">Revenue share you keep</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <AnimatedSection className="text-center mt-12">
            <Button 
              onClick={() => scrollToSection('how-it-works')}
              size="lg"
              variant="outline"
              className="px-8 py-4 text-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
            >
              Learn More
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* How It Works Section - Carousel */}
      <section id="how-it-works" className="py-20 bg-gradient-to-br from-background to-card/50 overflow-hidden">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-white text-center mb-16">
              From Your Knowledge to Monetized Datasets in Minutes
            </h2>
          </AnimatedSection>

          <div className="relative">
            <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory scrollbar-hide">
              {[
                {
                  step: "1",
                  title: "Verify & Interview",
                  description: "Link LinkedIn for expertise verification – begin AI interview",
                  icon: Linkedin,
                  bg: "bg-gradient-to-br from-blue-500 to-blue-600"
                },
                {
                  step: "2", 
                  title: "Create & Refine",
                  description: "LLM asks questions, generates instances – edit in our swipeable feed",
                  icon: MessageSquare,
                  bg: "bg-gradient-to-br from-primary to-accent"
                },
                {
                  step: "3",
                  title: "Own & Sell", 
                  description: "Finalize datasets with tags – set prices, get offers",
                  icon: DollarSign,
                  bg: "bg-gradient-to-br from-purple-500 to-purple-600"
                },
                {
                  step: "4",
                  title: "Earn & Empower",
                  description: "Keep 90%, use your personal LLM – join the ethical AI movement", 
                  icon: Sparkles,
                  bg: "bg-gradient-to-br from-amber-500 to-orange-500"
                }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div 
                    key={index}
                    className="flex-none w-80 bg-card/90 backdrop-blur-sm rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 highlight snap-start"
                  >
                    <div className="text-center">
                      <div className={`w-20 h-20 ${item.bg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                        <IconComponent className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-4xl font-bold text-primary mb-2">
                        {item.step}
                      </div>
                      <h3 className="text-2xl font-bold text-card-foreground mb-4">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    
                    {/* Hover Overlay - Stan Store style */}
                    <div className="expo absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <div className="text-white text-center p-6">
                        <IconComponent className="h-12 w-12 mx-auto mb-4" />
                        <div className="text-xl font-bold mb-2">{item.title}</div>
                        <div className="text-sm opacity-90">{item.description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AnimatedSection className="text-center mt-12">
            <Button 
              onClick={() => handleWaitlistSignup({ preventDefault: () => {} } as React.FormEvent)}
              size="lg"
              className="bg-primary hover:bg-primary/80 text-white px-8 py-4 text-lg rounded-xl shadow-xl transition-all duration-300"
            >
              Join Waitlist to Start
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-card-foreground text-center mb-16">
              Why LangSet? Reclaim Your Power in AI
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: DollarSign,
                title: "Earn $500-$5K+",
                description: "Per dataset (estimates based on similar AI data markets)",
                color: "text-primary"
              },
              {
                icon: Shield,
                title: "Ethical Ownership", 
                description: "Full control – anonymized, consent-based selling",
                color: "text-blue-500"
              },
              {
                icon: TrendingUp,
                title: "High-Quality Data",
                description: "LLM interviews + your edits ensure actionable, bias-reduced sets",
                color: "text-purple-500" 
              },
              {
                icon: Users,
                title: "For All Skills",
                description: "Work, hobbies, or expertise – monetize what you know",
                color: "text-amber-500"
              }
            ].map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <AnimatedSection key={index}>
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 highlight h-full">
                    <div className="text-center">
                      <div className={`w-16 h-16 ${benefit.color} mx-auto mb-4 bg-gray-50 rounded-2xl flex items-center justify-center`}>
                        <IconComponent className={`h-8 w-8 ${benefit.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-card-foreground mb-3">
                        {benefit.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-gradient-to-br from-background to-card/30 relative overflow-hidden">
        <ParallaxElement offset={-60} className="absolute top-10 right-10 opacity-30">
          <Globe className="h-32 w-32 text-primary/50 parallax-float" />
        </ParallaxElement>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-white mb-8">
              Join the Revolution: Ethical Data for a Fairer AI Future
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <p className="text-xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              In an era where AI spends billions on data ($4B market in 2025), 
              LangSet puts the power back in your hands. Earn from what you&apos;ve built.
            </p>
          </AnimatedSection>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              { value: "$17B", label: "AI Data Market by 2030", icon: Globe },
              { value: "90%", label: "You Keep of Earnings", icon: DollarSign },
              { value: "247+", label: "Early Adopters", icon: Users }
            ].map((stat, index) => (
              <AnimatedSection key={index}>
                <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
                  <stat.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                  <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-white/70">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Testimonial Carousel */}
          <AnimatedSection>
            <div className="bg-card/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10 max-w-2xl mx-auto">
              <blockquote className="text-xl italic text-white mb-4">
                &quot;Finally, control over my skills! This is the future of ethical AI.&quot;
              </blockquote>
              <cite className="text-primary flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-amber-400" />
                — Alex K., Beta User
                <Star className="h-4 w-4 text-amber-400" />
              </cite>
            </div>
          </AnimatedSection>

          <AnimatedSection className="mt-12">
            <Button 
              onClick={() => handleWaitlistSignup({ preventDefault: () => {} } as React.FormEvent)}
              size="lg"
              className="bg-primary hover:bg-primary/80 text-white px-12 py-6 text-xl rounded-xl shadow-2xl transition-all duration-300 hover:scale-105"
            >
              Join Now
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Database className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold text-white">LangSet.ai</span>
              </div>
              <p className="text-white/70 text-sm">
                Empowering knowledge workers in the AI era through ethical data monetization.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="/privacy-policy" className="hover:text-primary transition-colors">Privacy</a></li>
                <li><a href="/terms-of-service" className="hover:text-primary transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-white/70 text-sm">© 2025 LangSet.ai</p>
            
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" className="text-white/70 hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="text-center mt-8">
            <Button 
              onClick={() => handleWaitlistSignup({ preventDefault: () => {} } as React.FormEvent)}
              size="sm"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}