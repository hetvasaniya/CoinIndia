import React from 'react';
import { STATIC_IMAGES } from '../../data/staticImages';
import { useTheme } from '../../context/ThemeContext';

const About = () => {
  const { isDark } = useTheme();

  return (
    <div className={`transition-colors duration-300 ${isDark ? 'bg-dark-900 text-gray-100' : 'bg-[#FAF8F5] text-gray-900'}`}>
      {/* Hero Header */}
      <div className={`relative py-14 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden ${
        isDark ? 'bg-dark-950 text-white border-b border-dark-800' : 'bg-dark-900 text-white'
      }`}>
        <div className="absolute inset-0 opacity-20">
          <img 
            src={STATIC_IMAGES.about.heroBanner} 
            alt="Historical Numismatics" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <span className="text-xs uppercase tracking-[0.3em] text-gold-500 font-semibold mb-3 block">
            Custodians of Numismatic Heritage
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight mb-4 sm:mb-6 text-gray-200">
            Preserving History <br />
            <span className="italic text-gold-400">Forged in Metal</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Dedicated to the scholarly cataloging, authentication, and preservation of rare coins spanning over 2,500 years of the Indian subcontinent.
          </p>
        </div>
      </div>

      {/* Main Story & Visuals */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-10 sm:mb-16">
          <div className={`prose prose-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <h2 className={`text-2xl sm:text-3xl font-serif mb-4 sm:mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Mission</h2>
            <p className="mb-4 text-sm sm:text-base">
              Coinomart was founded with a singular mission: to preserve and share the rich numismatic heritage of the Indian subcontinent. 
              For centuries, coins have been more than just currency; they are tangible pieces of history, 
              bearing the marks of dynasties, trade routes, metallurgical triumphs, and cultural exchanges.
            </p>
            <p className="mb-4 text-sm sm:text-base">
              Our team of veteran numismatists travels the globe to source authentic, rare, and historically significant artifacts. 
              Every piece in our collection is carefully authenticated, cataloged with rigorous academic precision, and preserved for future generations.
            </p>
          </div>
          <div className="relative">
            <div className={`aspect-[4/3] rounded-xl overflow-hidden border shadow-md ${
              isDark ? 'border-dark-700' : 'border-gray-200'
            }`}>
              <img 
                src={STATIC_IMAGES.about.curatorAtWork} 
                alt="Expert numismatist authenticating ancient coin" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className={`absolute -bottom-6 -left-6 border p-4 rounded-lg shadow-xl max-w-xs hidden sm:block ${
              isDark ? 'bg-dark-800 border-gold-500/40 text-gray-200' : 'bg-white border-gold-500/40 text-gray-900'
            }`}>
              <p className="text-xs uppercase tracking-wider text-gold-500 font-semibold">Authentication Standard</p>
              <p className="text-sm font-serif mt-1">100% Genuine Specimen Guarantee with Archival Certification</p>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10 sm:my-16">
          {[
            { img: STATIC_IMAGES.about.magnifierAndCoins, title: 'Microscopic Verification', desc: 'Examining metal alloy composition, die axis, edge reeding, and authentic patina crystallization.' },
            { img: STATIC_IMAGES.about.ancientTradeMap, title: 'Historical Provenance', desc: 'Tracing each coin back to its issuing empire, royal mint mark, and historical geopolitical context.' },
            { img: STATIC_IMAGES.about.preservationTray, title: 'Museum-Grade Care', desc: 'Archival preservation in inert, non-PVC numismatic capsules ensuring permanent conservation.' },
          ].map((item, idx) => (
            <div key={idx} className={`border rounded-xl overflow-hidden p-4 card-hover ${
              isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200'
            }`}>
              <div className="h-44 sm:h-48 overflow-hidden rounded-lg mb-4">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className={`font-serif text-base sm:text-lg mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Quote Block */}
        <div className={`p-5 sm:p-8 md:p-12 border-l-4 border-gold-500 rounded-r-xl my-8 sm:my-12 text-center md:text-left ${
          isDark ? 'bg-dark-800' : 'bg-gold-50/50'
        }`}>
          <p className={`text-lg sm:text-xl md:text-2xl font-serif italic mb-2 ${isDark ? 'text-gold-400' : 'text-gray-900'}`}>
            "Numismatics is not just the study of coins; it is the study of history written in metal."
          </p>
          <span className="text-xs uppercase tracking-widest text-gold-500 font-semibold">
            — Coinomart Curatorial Board
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;
