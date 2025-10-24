'use client';

import { Analytics } from "@vercel/analytics/next";

export default function PolitiqueConfidentialitePage() {
  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <img
            src="https://res.cloudinary.com/dp98soedn/image/upload/v1761251325/logo_ajahwp.png"
            alt="ZTV+ Logo"
            className="w-40 h-16 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold mb-2">Politique de confidentialité</h1>
          <p className="text-gray-400">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Collecte des informations</h2>
            <p>
              Nous collectons les informations que vous nous fournissez directement, telles que
              votre nom, adresse e-mail, et préférences lors de la création de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Utilisation des informations</h2>
            <p>
              Les informations collectées sont utilisées pour :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Fournir et améliorer notre service</li>
              <li>Personnaliser votre expérience et vos recommandations</li>
              <li>Gérer votre compte, y compris votre watchlist et l&apos;historique de visionnage</li>
              <li>Communiquer avec vous concernant votre compte et nos services</li>
              <li>Assurer la sécurité de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Partage des informations</h2>
            <p>
              Nous ne vendons pas vos informations personnelles à des tiers. Nous pouvons partager
              vos informations uniquement dans les cas suivants :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Avec votre consentement explicite</li>
              <li>Pour respecter nos obligations légales</li>
              <li>Pour protéger nos droits et ceux de nos utilisateurs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Cookies et technologies similaires</h2>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme.
              Vous pouvez contrôler l&apos;utilisation des cookies via les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Sécurité des données</h2>
            <p>
              Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations
              contre tout accès non autorisé, modification, divulgation ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Conservation des données</h2>
            <p>
              Nous conservons vos informations aussi longtemps que nécessaire pour fournir nos services
              ou comme requis par la loi. Vous pouvez demander la suppression de votre compte à tout moment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Vos droits</h2>
            <p>
              Conformément à la réglementation applicable, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
              <li>Droit d&apos;accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l&apos;effacement</li>
              <li>Droit à la portabilité</li>
              <li>Droit d&apos;opposition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Modifications de cette politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité de temps à autre.
              Nous vous informerons de tout changement important.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Contact</h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour exercer
              vos droits, contactez-nous à l&apos;adresse privacy@ztvplus.com
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
