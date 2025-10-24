'use client';

import { Analytics } from "@vercel/analytics/next";

export default function ConditionsUtilisationPage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
            alt="ZTV+ Logo"
            className="w-40 h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Conditions d&apos;utilisation</h1>
          <p className="text-gray-400">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptation des conditions</h2>
            <p>
              En accédant et en utilisant ZTV+, vous acceptez d&apos;être lié par ces conditions d&apos;utilisation.
              Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description du service</h2>
            <p>
              ZTV+ est une plateforme de streaming qui offre du contenu vidéo en direct et à la demande,
              incluant des films, séries et animes. Notre service est destiné à tous les utilisateurs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Comptes utilisateur</h2>
            <p>
              Pour accéder à certains contenus, vous devez créer un compte. Vous êtes responsable
              de maintenir la confidentialité de vos informations d&apos;identification et de toutes
              les activités qui se déroulent sous votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Contenu et droits d&apos;auteur</h2>
            <p>
              Tout le contenu disponible sur ZTV+ est protégé par les droits d&apos;auteur.
              Veuillez noter que nous n&apos;hébergeons aucun contenu sur notre plateforme.
              Vous n&apos;êtes pas autorisé à copier, distribuer ou modifier ce contenu sans autorisation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Comportement des utilisateurs</h2>
            <p>
              Vous vous engagez à utiliser ZTV+ de manière responsable et à ne pas :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Violer les lois ou réglementations applicables</li>
              <li>Perturber le fonctionnement du service</li>
              <li>Partager du contenu inapproprié</li>
              <li>Tenter d&apos;accéder à des zones non autorisées</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Résiliation</h2>
            <p>
              Nous nous réservons le droit de suspendre ou de résilier votre accès à ZTV+
              en cas de violation de ces conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Modifications</h2>
            <p>
              Nous pouvons modifier ces conditions à tout moment. Les modifications prendront
              effet dès leur publication sur cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Contact</h2>
            <p>
              Pour toute question concernant ces conditions, contactez-nous à l&apos;adresse
              support@ztvplus.com
            </p>
          </section>
        </div>

        <div className="text-center mt-12">
          <a
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
      <Analytics />
    </div>
  );
}
