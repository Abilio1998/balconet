import dynamic from 'next/dynamic'
import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import Footer from '@/components/Footer'

import AboutSection from '@/components/AboutSection'
import FeaturedDish from '@/components/FeaturedDish'
import GastronomyHub from '@/components/GastronomyHub'
import ReviewsSection from '@/components/ReviewsSection'
import ContactSection from '@/components/ContactSection'

export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedDish />
      <GastronomyHub />
      <ReviewsSection />
      <ContactSection />
      <Footer />
    </main>
  )
}
