import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import About from "@/components/About";
import Team from "@/components/Team";
import Schedule from "@/components/Schedule";
import Gallery from "@/components/Gallery";
import Directions from "@/components/Directions";
import Pricing from "@/components/Pricing";
import Promotions from "@/components/Promotions";
import CtaSection from "@/components/CtaSection";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import { BranchProvider } from "@/contexts/BranchContext";

const Index = () => {
  return (
    <BranchProvider>
      <Header />
      <Hero />
      <Marquee />
      <About />
      <Team />
      <Schedule />
      <Gallery />
      <Directions />
      <Pricing />
      <Promotions />
      <CtaSection />
      <Faq />
      <Footer />
    </BranchProvider>
  );
};

export default Index;
