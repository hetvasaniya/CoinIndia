/**
 * ==============================================================================
 * CoinIndia Static Visual Assets & Image Repository
 * ==============================================================================
 * 
 * NOTE: These images are used STRICTLY for static website details, branding,
 * UI decoration, hero banners, the about page, category covers, period highlights,
 * certificates of authenticity, and fallback placeholders.
 * 
 * They are NOT inventory items for sale.
 * You can replace any URL below with your local asset paths (e.g., '/images/logo.png')
 * or CDN / Cloudinary URLs anytime.
 */

export const STATIC_IMAGES = {
  // Brand & Logo
  logo: {
    symbol: 'https://images.unsplash.com/photo-1621503923015-89bd2399d868?auto=format&fit=crop&w=120&q=80',
    emblem: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=200&q=80',
    sealGold: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=300&q=80',
  },

  // Hero & Homepage Sections
  hero: {
    featuredArtefact: 'https://plus.unsplash.com/premium_photo-1680396761982-0bdd9675af35?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    backgroundTexture: 'https://images.unsplash.com/photo-1768429670472-c37090eb7e37?q=80&w=794&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    showcaseDisplay: 'https://images.unsplash.com/photo-1768429670472-c37090eb7e37?q=80&w=794&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },

  // About Us Page & Storytelling
  about: {
    heroBanner: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    curatorAtWork: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=800&q=80',
    magnifierAndCoins: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
    ancientTradeMap: 'https://images.unsplash.com/photo-1524654458049-e36be0721fa2?auto=format&fit=crop&w=800&q=80',
    numismaticVault: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    preservationTray: 'https://images.unsplash.com/photo-1768429670472-c37090eb7e37?q=80&w=794&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
  },

  // Historical Periods Curated Covers
  periods: [
    {
      id: 'ancient-india',
      title: 'Ancient India',
      subtitle: '600 BCE – 300 CE (Punch-marked, Maurya & Kushan)',
      img: 'https://images.unsplash.com/photo-1672945690877-5307346cde57?q=80&w=715&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 'islamic-mughal',
      title: 'Islamic & Mughal',
      subtitle: '1526 – 1857 CE (Akbar, Jahangir & Shah Jahan)',
      img: 'https://images.unsplash.com/photo-1727169705454-42fb2a477d5d?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 'british-india',
      title: 'British India',
      subtitle: '1835 – 1947 CE (East India Co., Victoria & George V)',
      img: 'https://images.unsplash.com/photo-1554134449-8ad2b1dea29e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
    {
      id: 'princely-states',
      title: 'Princely States',
      subtitle: '1700 – 1948 CE (Hyderabad, Mysore, Maratha & Gwalior)',
      img: 'https://images.unsplash.com/photo-1726916815921-9c37fea8a3b3?q=80&w=1167&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    },
  ],

  // Category Thumbnails
  categories: {
    gold: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=500&q=80',
    silver: 'https://images.unsplash.com/photo-1621503923015-89bd2399d868?auto=format&fit=crop&w=500&q=80',
    copper: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=500&q=80',
    commemorative: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=500&q=80',
    ancient: 'https://images.unsplash.com/photo-1605389658253-15792c90c74a?auto=format&fit=crop&w=500&q=80',
  },

  // Certificate of Authenticity & Guarantees
  certificate: {
    watermarkSeal: 'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=400&q=80',
    embossedStamp: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=300&q=80',
  },

  // Fallbacks & Placeholders
  placeholders: {
    coinFront: 'https://images.unsplash.com/photo-1621503923015-89bd2399d868?auto=format&fit=crop&w=600&q=80',
    coinBack: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=600&q=80',
    coinCard: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?auto=format&fit=crop&w=400&q=80',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    thumbnail: 'https://placehold.co/100x100/1a1a1a/B8860B?text=Coin',
  },
};

export default STATIC_IMAGES;
