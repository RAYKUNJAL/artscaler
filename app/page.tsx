'use client';

import Hero from '@/components/landing/Hero';
import WhyTrust from '@/components/landing/WhyTrust';
import HowItWorks from '@/components/landing/HowItWorks';
import Features from '@/components/landing/Features';
import Pricing from '@/components/landing/Pricing';
import SocialProof from '@/components/landing/SocialProof';
import FinalCTA from '@/components/landing/FinalCTA';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 font-inter">
      <main>
        <Hero />
        <WhyTrust />
        <HowItWorks />
        <Features />
        <Pricing />
        <SocialProof />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
