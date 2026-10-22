'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function NotFound() {
  const [isLoaded, setIsLoaded] = useState(false);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 text-center">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-100 mb-6 drop-shadow-sm w-[90%] md:w-[70%] mx-auto">
        Oops! This page has wandered off.
      </h1>

      <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border-4 border-gray-800 max-w-sm w-full min-h-[200px] sm:min-h-[200px] flex items-center justify-center bg-gray-800/50">
        <Image
          src="/fat-cat.gif"
          alt="404 - Page not found - Chef Meal Catering"
          width={500}
          height={200}
          className={`object-cover w-full h-auto transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          unoptimized={true}
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      <p className="text-base md:text-lg text-gray-300 mb-8 max-w-md">
        No worries - use the button below to get back:
      </p>

      <Link
        href="/"
        className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Back to home
      </Link>
    </div>
  );
}
