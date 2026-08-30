import React from 'react';
import { STATIC_IMAGES } from '../../data/staticImages';

const About = () => {
  return (
    <div className="bg-white">
      {/* Hero Header with Static Visual */}
      <div className="relative bg-[#1a1a1a] text-white py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={STATIC_IMAGES.about.heroBanner} 
            alt="Historical Numismatics" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-4xl mx-auto text-center z-10">
          <span className="text-xs uppercase tracking-[0.3em] text-[#B8860B] font-semibold mb-3 block">
            Custodians of Numismatic Heritage
          </span>
          <h1 className="text-4xl md:text-6xl font-serif leading-tight mb-6">
            Preserving History <br />
            <span className="italic text-[#B8860B]">Forged in Metal</span>
          </h1>
          <p className="text-lg text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Dedicated to the scholarly cataloging, authentication, and preservation of rare coins spanning over 2,500 years of the Indian subcontinent.
          </p>
        </div>
      </div>

      {/* Main Story & Visuals */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="prose prose-lg text-gray-600 font-sans leading-relaxed">
            <h2 className="text-3xl font-serif text-[#1a1a1a] mb-6">Our Mission</h2>
            <p className="mb-4">
              Coin India was founded with a singular mission: to preserve and share the rich numismatic heritage of the Indian subcontinent. 
              For centuries, coins have been more than just currency; they are tangible pieces of history, 
              bearing the marks of dynasties, trade routes, metallurgical triumphs, and cultural exchanges.
            </p>
            <p className="mb-4">
              Our team of veteran numismatists travels the globe to source authentic, rare, and historically significant artifacts. 
              Every piece in our collection is carefully authenticated, cataloged with rigorous academic precision, and preserved for future generations.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-sm overflow-hidden border border-gray-200 shadow-md">
              <img 
                src={STATIC_IMAGES.about.curatorAtWork} 
                alt="Expert numismatist authenticating ancient coin" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-[#FAFAF7] border border-[#B8860B] p-4 rounded-sm shadow-lg max-w-xs hidden sm:block">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">Authentication Standard</p>
              <p className="text-sm font-serif text-[#1a1a1a] mt-1">100% Genuine Specimen Guarantee with Archival Certification</p>
            </div>
          </div>
        </div>

        {/* Static Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-16">
          <div className="bg-[#FAFAF7] border border-gray-200 rounded-sm overflow-hidden p-4">
            <div className="h-48 overflow-hidden rounded-sm mb-4">
              <img 
                src={STATIC_IMAGES.about.magnifierAndCoins} 
                alt="Numismatic examination tools" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-2">Microscopic Verification</h3>
            <p className="text-sm text-gray-600">
              Examining metal alloy composition, die axis, edge reeding, and authentic patina crystallization.
            </p>
          </div>

          <div className="bg-[#FAFAF7] border border-gray-200 rounded-sm overflow-hidden p-4">
            <div className="h-48 overflow-hidden rounded-sm mb-4">
              <img 
                src={STATIC_IMAGES.about.ancientTradeMap} 
                alt="Ancient trade routes and mint origins" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-2">Historical Provenance</h3>
            <p className="text-sm text-gray-600">
              Tracing each coin back to its issuing empire, royal mint mark, and historical geopolitical context.
            </p>
          </div>

          <div className="bg-[#FAFAF7] border border-gray-200 rounded-sm overflow-hidden p-4">
            <div className="h-48 overflow-hidden rounded-sm mb-4">
              <img 
                src={STATIC_IMAGES.about.preservationTray} 
                alt="Archival numismatic storage" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <h3 className="font-serif text-lg text-[#1a1a1a] mb-2">Museum-Grade Care</h3>
            <p className="text-sm text-gray-600">
              Archival preservation in inert, non-PVC numismatic capsules ensuring permanent conservation.
            </p>
          </div>
        </div>

        {/* Quote Block */}
        <div className="bg-[#FAFAF7] p-8 md:p-12 border-l-4 border-[#B8860B] my-12 text-center md:text-left">
          <p className="text-2xl font-serif italic text-[#1a1a1a] mb-2">
            "Numismatics is not just the study of coins; it is the study of history written in metal."
          </p>
          <span className="text-xs uppercase tracking-widest text-[#B8860B] font-semibold">
            — CoinIndia Curatorial Board
          </span>
        </div>
      </div>
    </div>
  );
};

export default About;
