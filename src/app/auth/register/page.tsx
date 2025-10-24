'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Analytics } from "@vercel/analytics/next";

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (France métropolitaine)' },
  { value: 'Europe/Brussels', label: 'Bruxelles (Belgique)' },
  { value: 'Indian/Mayotte', label: 'Mayotte' },
  { value: 'Indian/Mauritius', label: 'Maurice (Île Maurice)' },
  { value: 'Indian/Reunion', label: 'Réunion' }
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    timezone: TIMEZONES[0].value,
    avatar: null as File | null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('timezone', formData.timezone);

      if (formData.avatar) {
        formDataToSend.append('avatar', formData.avatar);
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Registration successful:', data);
        alert('Inscription réussie! Redirection vers la page de connexion...');
        // Redirection vers la page de connexion
        router.push('/auth/login');
      } else {
        console.error('Registration failed:', data.error);
        alert(`Erreur: ${data.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 md:mb-8">
          <img 
            src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
            alt="ZTV+ Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain mx-auto mb-4 md:mb-6"
          />
          
          <h1 className="text-xl md:text-3xl font-bold text-white mb-2">
            Créez votre compte ZTVPlus
          </h1>
        </div>

        {/* Register Form */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Nom complet
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="Votre nom complet"
              />
            </div>

            {/* Username Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Nom d&apos;utilisateur
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="Votre nom d'utilisateur"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="votre@email.com"
              />
            </div>

            {/* Avatar Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Avatar
              </label>
              <input
                type="file"
                name="avatar"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData(prev => ({
                      ...prev,
                      avatar: file
                    }));
                  }
                }}
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 text-base md:text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Formats acceptés: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            {/* Timezone Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Fuseau horaire
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    timezone: e.target.value
                  }));
                }}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Choisissez votre région pour afficher les dates correctement
              </p>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-3 py-3 md:py-2 bg-gray-800 border border-gray-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm"
                placeholder="••••••••"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start text-sm">
              <input
                type="checkbox"
                required
                className="mr-3 w-4 h-4 bg-gray-800 border-gray-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
              />
              <label className="text-gray-400 text-xs md:text-sm">
              J&apos;accepte les{' '}
              <a href="/conditions-d-utilisation" className="text-blue-400 hover:text-blue-300">
              conditions d&apos;utilisation
              </a>{' '}
              et la{' '}
              <a href="/politique-de-confidentialite" className="text-blue-400 hover:text-blue-300">
              politique de confidentialité
              </a>
              </label>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 md:py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm"
            >
              {isLoading ? 'Création du compte...' : "Créer mon compte"}
            </button>
          </form>

          {/* Login Section */}
          <div className="mt-4 md:mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Déjà un compte ?{' '}
              <a href="/auth/login" className="text-blue-400 hover:text-blue-300">
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
