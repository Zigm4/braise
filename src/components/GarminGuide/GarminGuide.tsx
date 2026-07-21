function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-display text-xl mb-3">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'var(--ink)' }}>
        {children}
      </div>
    </section>
  )
}

/** Verified mid-2026: Garmin transfer paths, Strava strength overhaul, WatchFit. */
export function GarminGuide() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
        Garmin Connect n'accepte pas l'import de fichiers d'entraînement FIT : seules les
        activités terminées s'importent. Deux méthodes fonctionnent pour installer tes
        séances Braise sur ta montre.
      </p>

      <Block title="Méthode 1 · Transfert USB (recommandée)">
        <ol className="list-decimal ml-5 space-y-2">
          <li>Branche la montre en USB et ouvre son stockage interne.</li>
          <li>
            Va dans le dossier <code className="font-mono">GARMIN/NewFiles</code> (à défaut{' '}
            <code className="font-mono">GARMIN/Workouts</code>).
          </li>
          <li>Colle les fichiers .fit téléchargés depuis Braise, puis éjecte la montre.</li>
          <li>
            Les séances apparaissent dans le menu Entraînements de la montre, puis dans Garmin
            Connect après synchronisation, où elles restent modifiables.
          </li>
        </ol>
        <p style={{ color: 'var(--ink-muted)' }}>
          Note macOS : les montres récentes montent en MTP. Utilise OpenMTP (gratuit) ou
          MacDroid ; Android File Transfer n'est plus distribué. Si la séance n'apparaît pas,
          redémarre la montre.
        </p>
      </Block>

      <Block title="Méthode 2 · Création manuelle dans Garmin Connect">
        <p>
          Entraînement et planification, puis Entraînements, Créer un entraînement,
          Musculation. Ajoute chaque exercice en le cherchant par son nom Garmin, affiché sur
          chaque fiche exercice de Braise. Règle les répétitions, les repos et les tours, puis
          envoie vers l'appareil.
        </p>
      </Block>

      <Block title="Et Strava ?">
        <p>
          Rien à faire : c'est automatique. Depuis mai 2026, Strava affiche pour chaque
          activité de musculation le détail des exercices (noms, séries, répétitions, charges)
          et génère sa propre carte musculaire. Ces données arrivent via la synchronisation
          Garmin Connect vers Strava, et les séances Braise encodent les vrais identifiants
          d'exercices Garmin : ta séance apparaît donc sur Strava avec le bon détail.
        </p>
        <p style={{ color: 'var(--ink-muted)' }}>
          Après la séance, tu peux aussi attacher l'image PNG exportée depuis Braise à ton
          activité (Garmin Connect ou Strava : modifier l'activité, ajouter une photo).
        </p>
      </Block>

      <Block title="Apple Watch">
        <p>
          L'app Exercice d'Apple ne sait pas importer de fichier d'entraînement. La passerelle
          qui fonctionne : l'app <strong>WatchFit</strong> (App Store) importe les fichiers
          .fit de Braise et pousse la séance structurée vers l'app Exercice native via
          WorkoutKit.
        </p>
      </Block>
    </div>
  )
}
