import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Logo et description */}
        <div className="mb-8">
          <div className="mb-4">
            <img 
              src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
              alt="ZTV+ Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <p className="text-gray-400 text-sm max-w-md">
            Votre plateforme de streaming premium en France. Découvrez une sélection soigneusement choisie de films et séries.
          </p>
        </div>

        {/* Contenu principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/movies" className="text-gray-400 hover:text-sky-400 transition-colors">Films</Link></li>
              <li><Link href="/series" className="text-gray-400 hover:text-sky-400 transition-colors">Séries</Link></li>
              <li><Link href="/search" className="text-gray-400 hover:text-sky-400 transition-colors">Recherche</Link></li>
              <li><Link href="/trending" className="text-gray-400 hover:text-sky-400 transition-colors">Tendances</Link></li>
            </ul>
          </div>
          
          {/* Compte */}
          <div>
            <h3 className="text-white font-semibold mb-4">Compte</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/auth/login" className="text-gray-400 hover:text-sky-400 transition-colors">Connexion</Link></li>
              <li><Link href="/auth/register" className="text-gray-400 hover:text-sky-400 transition-colors">Inscription</Link></li>
              <li><Link href="/profile" className="text-gray-400 hover:text-sky-400 transition-colors">Mon profil</Link></li>
              <li><Link href="/watchlist" className="text-gray-400 hover:text-sky-400 transition-colors">Ma watchlist</Link></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/help" className="text-gray-400 hover:text-sky-400 transition-colors">Centre d'aide</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-sky-400 transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-sky-400 transition-colors">FAQ</Link></li>
              <li><Link href="/legal" className="text-gray-400 hover:text-sky-400 transition-colors">Mentions légales</Link></li>
            </ul>
          </div>

          {/* Réseaux sociaux */}
          <div>
            <h3 className="text-white font-semibold mb-4">Suivez-nous</h3>
            <div className="flex space-x-4">
              <a 
                href="https://twitter.com/ztvplusfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-400 transition-colors"
                aria-label="Twitter"
              >
                <i className="ti ti-brand-twitter text-xl"></i>
              </a>
              <a 
                href="https://instagram.com/ztvplusfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-400 transition-colors"
                aria-label="Instagram"
              >
                <i className="ti ti-brand-instagram text-xl"></i>
              </a>
              <a 
                href="https://facebook.com/ztvplusfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-400 transition-colors"
                aria-label="Facebook"
              >
                <i className="ti ti-brand-facebook text-xl"></i>
              </a>
              <a 
                href="https://youtube.com/@ztvplusfr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-sky-400 transition-colors"
                aria-label="YouTube"
              >
                <i className="ti ti-brand-youtube text-xl"></i>
              </a>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              @ztvplusfr
            </p>
          </div>
        </div>
        
        {/* Mention légale importante */}
        <div className="border-t border-gray-800 pt-6 mb-6">
          <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm text-center">
              <i className="ti ti-shield-check text-sky-400 mr-2"></i>
              <strong>ZTVPlus ne stocke aucun fichier vidéo sur la plateforme.</strong> 
              <br className="hidden sm:block" />
              <span className="block sm:inline mt-1 sm:mt-0 sm:ml-2">
                Tous les contenus sont hébergés par des services tiers.
              </span>
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-gray-800 pt-6 text-center">
          <p className="text-gray-400 text-sm">
            © 2025 ZTV+ France. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
