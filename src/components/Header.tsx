'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  role: string;
}

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: number;
    title: string;
    originalTitle?: string;
    year?: number;
    rating?: number;
    poster?: string;
    type: 'movie' | 'series';
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    // Gérer l'effet de scroll
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(null);
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    if (!isSearchOpen) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
    setIsSearchOpen(false);
    setIsUserDropdownOpen(false);
  };

  const handleUserDropdownToggle = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  };

  const handleResultClick = (result: {
    id: number;
    type: 'movie' | 'series';
  }) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    
    if (result.type === 'movie') {
      router.push(`/movies/${result.id}`);
    } else if (result.type === 'series') {
      router.push(`/series/${result.id}`);
    }
  };

  if (isLoading) {
    return (
      <header className="bg-transparent sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-20 h-20 bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="w-24 h-8 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`sticky top-0 z-40 transition-all duration-500 ${
      isScrolled ? 'bg-black/90 backdrop-blur-xl shadow-xl' : 'bg-transparent'
    }`}>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et Navigation */}
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link href="/" className="flex items-center">
              <img 
                src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
                alt="ZTV+ Logo" 
                className="w-16 h-16 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain"
              />
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <Link href="/" className="text-gray-300 hover:text-white transition-colors relative group flex items-center space-x-2">
                <i className="ti ti-home text-lg"></i>
                <span>Accueil</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/movies" className="text-gray-300 hover:text-white transition-colors relative group flex items-center space-x-2">
                <i className="ti ti-movie text-lg"></i>
                <span>Films</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link href="/series" className="text-gray-300 hover:text-white transition-colors relative group flex items-center space-x-2">
                <i className="ti ti-device-tv text-lg"></i>
                <span>Séries</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Icône Search - Desktop */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={handleSearchToggle}
                className={`transition-colors flex items-center justify-center w-10 h-10 ${
                  isSearchOpen
                    ? 'text-blue-400'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className="ti ti-search text-2xl"></i>
              </button>
            </div>
            
            {user ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-1 md:space-x-2 text-white hover:text-gray-300 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="hidden md:block text-sm md:text-base">{user.name || user.username}</span>
                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-600">
                      <p className="text-sm text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    
                    <Link
                    href="/me"
                    className="block px-4 py-3 text-sm text-gray-300 hover:bg-green-600 hover:text-white transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                    >
                    <i className="ti ti-home mr-2"></i>
                    Mon espace
                    </Link>

                    <Link
                      href="/account"
                      className="block px-4 py-3 text-sm text-gray-300 hover:bg-blue-600 hover:text-white transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ti ti-user mr-2"></i>
                      Mon compte
                    </Link>
                    
                    <Link
                      href="/settings"
                      className="block px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <i className="ti ti-settings mr-2"></i>
                      Paramètres
                    </Link>

                     {user.role === 'ADMIN' && (
                      <>
                        <div className="border-t border-gray-600"></div>
                        <Link
                          href="/admin"
                          className="block px-4 py-3 text-sm text-gray-300 hover:bg-purple-600 hover:text-white transition-colors duration-200"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <i className="ti ti-shield mr-2"></i>
                          Administration
                        </Link>
                      </>
                    )}
                    
                    <div className="border-t border-gray-600"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
                    >
                      <i className="ti ti-logout mr-2"></i>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Inscription
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: Search, Avatar, Watchlist, Menu */}
          <div className="md:hidden flex items-center space-x-3">
            <button 
              onClick={handleSearchToggle}
              className={`transition-colors flex items-center justify-center w-10 h-10 ${
                isSearchOpen 
                  ? 'text-blue-400' 
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <i className="ti ti-search text-xl"></i>
            </button>
            
            {/* Watchlist - seulement si connecté */}
            {user && (
              <Link 
                href="/watchlist" 
                className={`transition-colors flex items-center justify-center w-10 h-10 ${
                  pathname === '/watchlist' 
                    ? 'text-blue-400' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                <i className="ti ti-bookmark text-xl"></i>
              </Link>
            )}
            
            {/* Avatar dropdown - seulement si connecté */}
            {user && (
              <div className="relative">
                <button
                  onClick={handleUserDropdownToggle}
                  className="flex items-center space-x-1 text-white hover:text-gray-300 transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                    </div>
                  )}
                </button>

                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-gray-700 rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-300">{user.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                    <Link
                    href="/me"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsUserDropdownOpen(false)}
                    >
                    <i className="ti ti-home mr-2"></i>
                      Mon espace
                    </Link>
                    <Link
                      href="/account"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      Mon compte
                    </Link>
                    <Link
                    href="/settings"
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <i className="ti ti-settings mr-2"></i>
                      Paramètres
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        Administration
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Menu hamburger - seulement si pas connecté */}
            {!user && (
              <button
                onClick={handleMenuToggle}
                className="text-gray-300 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        {isSearchOpen && (
          <div className="border-t border-gray-700 py-4">
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher des films, séries..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="w-full px-4 py-3 pr-12 bg-black border border-white text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 placeholder-gray-400"
                  autoFocus
                />
                <button
                  onClick={handleSearchToggle}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                >
                  <i className="ti ti-x text-xl"></i>
                </button>
              </div>
              
              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-3 rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50 bg-black border border-white"
                >
                  {isSearching ? (
                    <div className="p-6 text-center text-gray-300">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-500 border-t-blue-500 mx-auto"></div>
                      <p className="mt-3 text-sm">Recherche en cours...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-4 py-4 hover:bg-gray-800 transition-all duration-200 flex items-center space-x-4 border-b border-gray-600 last:border-b-0"
                        >
                          <img
                            src={result.poster || '/placeholder-movie.jpg'}
                            alt={result.title}
                            className="w-14 h-20 object-cover rounded-lg shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                            }}
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-base mb-1">{result.title}</h3>
                            <p className="text-gray-400 text-sm mb-1">
                              {result.type === 'movie' ? 'Film' : 'Série'} • {result.year}
                            </p>
                            {result.rating && (
                              <p className="text-blue-400 text-sm font-medium">
                                ⭐ {result.rating}/10
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-400">
                      <i className="ti ti-search-off text-3xl mb-3 block"></i>
                      <p className="text-sm">Aucun résultat trouvé pour &quot;{searchQuery}&quot;</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Menu - Seulement si pas connecté */}
        {isMenuOpen && !user && (
          <div className="lg:hidden border-t border-gray-700 py-4">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-4 py-2 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="ti ti-home text-lg"></i>
                <span>Accueil</span>
              </Link>
              <Link
                href="/movies"
                className="text-gray-300 hover:text-white px-4 py-2 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="ti ti-movie text-lg"></i>
                <span>Films</span>
              </Link>
              <Link
                href="/series"
                className="text-gray-300 hover:text-white px-4 py-2 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="ti ti-device-tv text-lg"></i>
                <span>Séries</span>
              </Link>
              
              {/* Boutons d'authentification pour mobile */}
              <div className="border-t border-gray-700 my-2"></div>
              <Link
                href="/auth/login"
                className="text-gray-300 hover:text-white px-4 py-2 transition-colors flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="ti ti-login text-lg"></i>
                <span>Se connecter</span>
              </Link>
              <Link
                href="/auth/register"
                className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors flex items-center space-x-2 mx-4"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="ti ti-user-plus text-lg"></i>
                <span>S'inscrire</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
