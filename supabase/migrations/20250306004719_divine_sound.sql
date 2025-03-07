/*
  # Mise à jour du schéma des questions

  1. Changements
    - Suppression sécurisée des tables existantes avec leurs dépendances
    - Création d'un nouveau type enum pour les catégories cognitives
    - Recréation de la table questions avec les contraintes
    - Ajout des politiques de sécurité RLS
    - Insertion des questions initiales

  2. Sécurité
    - Enable RLS sur la table questions
    - Politique de lecture pour les utilisateurs authentifiés
    - Politique de gestion complète pour les administrateurs
*/

-- Supprimer d'abord la contrainte de clé étrangère
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_question_id_fkey;

-- Maintenant on peut supprimer la table et le type en toute sécurité
DROP TABLE IF EXISTS questions;
DROP TYPE IF EXISTS cognitive_category;

-- Create enum type for categories
CREATE TYPE cognitive_category AS ENUM (
  'Inhibition',
  'Flexibilité cognitive',
  'Contrôle émotionnel',
  'Initiative',
  'Mémoire de travail',
  'Planification et organisation',
  'Auto-régulation'
);

-- Create questions table
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category cognitive_category NOT NULL,
  question text NOT NULL,
  answers jsonb NOT NULL DEFAULT '[
    {"text": "Jamais", "score": 0.0},
    {"text": "Parfois", "score": 1.0},
    {"text": "Souvent", "score": 2.0},
    {"text": "Très souvent", "score": 3.0}
  ]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT answers_is_array CHECK (jsonb_typeof(answers) = 'array'),
  CONSTRAINT answers_not_empty CHECK (jsonb_array_length(answers) > 0)
);

-- Enable RLS
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin users to manage questions"
  ON questions
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert all questions
INSERT INTO questions (category, question) VALUES
-- Inhibition
('Inhibition', 'L''enfant interrompt souvent les autres en parlant'),
('Inhibition', 'Il/elle a du mal à attendre son tour'),
('Inhibition', 'Il/elle ne réfléchit pas avant d''agir'),
('Inhibition', 'Il/elle agit impulsivement sans tenir compte des conséquences'),
('Inhibition', 'Il/elle parle à des moments inappropriés en classe'),
('Inhibition', 'Il/elle a du mal à freiner ses actions lorsqu''on lui demande d''arrêter'),
('Inhibition', 'Il/elle a du mal à rester assis(e) pendant une tâche longue'),
('Inhibition', 'Il/elle s''attire souvent des ennuis s''il n''est pas supervisé'),
('Inhibition', 'Il/elle se lève de son siège au mauvais moment'),
('Inhibition', 'Il/elle parle trop bruyamment ou joue de manière excessive'),

-- Flexibilité cognitive
('Flexibilité cognitive', 'L''enfant résiste aux changements de routine ou de planification'),
('Flexibilité cognitive', 'Il/elle a des difficultés à changer de stratégie lorsqu''un problème se pose'),
('Flexibilité cognitive', 'Il/elle se bloque sur un problème et n''envisage pas d''autres solutions'),
('Flexibilité cognitive', 'Il/elle a du mal à s''adapter aux nouvelles situations scolaires'),
('Flexibilité cognitive', 'Il/elle est contrarié(e) par les changements de professeurs ou de camarades'),
('Flexibilité cognitive', 'Il/elle met du temps à s''habituer à de nouveaux environnements'),
('Flexibilité cognitive', 'Il/elle refuse d''essayer des méthodes alternatives pour accomplir une tâche'),
('Flexibilité cognitive', 'Il/elle pense trop à un sujet ou reste fixé sur une activité spécifique'),
('Flexibilité cognitive', 'Il/elle exprime des émotions négatives lorsqu''un changement est imposé'),
('Flexibilité cognitive', 'Il/elle manifeste une résistance aux nouvelles consignes scolaires'),

-- Contrôle émotionnel
('Contrôle émotionnel', 'L''enfant se met en colère pour des raisons mineures'),
('Contrôle émotionnel', 'Il/elle fait des crises de colère soudaines'),
('Contrôle émotionnel', 'Il/elle est souvent bouleversé(e) par de petits changements'),
('Contrôle émotionnel', 'Il/elle a de fréquents changements d''humeur'),
('Contrôle émotionnel', 'Il/elle pleure ou s''énerve plus facilement que ses camarades'),
('Contrôle émotionnel', 'Il/elle a du mal à gérer son stress en classe'),
('Contrôle émotionnel', 'Il/elle est excessivement contrarié(e) par des critiques mineures'),
('Contrôle émotionnel', 'Il/elle a des réactions disproportionnées face à des événements mineurs'),
('Contrôle émotionnel', 'Il/elle se renferme après un échec ou une remarque négative'),
('Contrôle émotionnel', 'Il/elle a des émotions qui varient fortement en peu de temps'),

-- Initiative
('Initiative', 'L''enfant a du mal à commencer une tâche sans aide'),
('Initiative', 'Il/elle ne prend pas l''initiative de faire ses devoirs ou corvées'),
('Initiative', 'Il/elle a besoin d''être constamment encouragé(e) pour démarrer une activité'),
('Initiative', 'Il/elle ne propose pas de solutions nouvelles aux problèmes rencontrés'),
('Initiative', 'Il/elle évite d''essayer des méthodes alternatives pour résoudre un problème'),
('Initiative', 'Il/elle tarde à démarrer un projet sans directives claires'),
('Initiative', 'Il/elle ne fait pas de liens entre ses actions et les résultats obtenus'),

-- Mémoire de travail
('Mémoire de travail', 'L''enfant oublie rapidement les consignes données'),
('Mémoire de travail', 'Il/elle a du mal à se souvenir de plusieurs instructions en même temps'),
('Mémoire de travail', 'Il/elle oublie souvent où sont ses affaires'),
('Mémoire de travail', 'Il/elle a du mal à terminer une tâche commencée'),
('Mémoire de travail', 'Il/elle doit demander qu''on répète souvent les consignes'),
('Mémoire de travail', 'Il/elle oublie de remettre ses devoirs en classe'),
('Mémoire de travail', 'Il/elle oublie fréquemment ce qu''il était en train de faire'),
('Mémoire de travail', 'Il/elle se déconcentre facilement pendant une tâche longue'),
('Mémoire de travail', 'Il/elle a du mal à retenir de nouvelles informations en classe'),
('Mémoire de travail', 'Il/elle se perd dans ses pensées lorsqu''il doit écouter une explication'),

-- Planification et organisation
('Planification et organisation', 'L''enfant oublie souvent son matériel scolaire'),
('Planification et organisation', 'Il/elle commence rarement un travail de lui-même'),
('Planification et organisation', 'Il/elle a du mal à anticiper ses devoirs et projets scolaires'),
('Planification et organisation', 'Il/elle a du mal à organiser ses affaires de manière efficace'),
('Planification et organisation', 'Il/elle commence ses devoirs à la dernière minute'),
('Planification et organisation', 'Il/elle sous-estime le temps nécessaire pour accomplir une tâche'),
('Planification et organisation', 'Il/elle perd souvent des objets importants (livres, stylos…)'),
('Planification et organisation', 'Il/elle oublie fréquemment de rendre ses devoirs à temps'),
('Planification et organisation', 'Il/elle ne planifie pas à l''avance ses activités scolaires'),
('Planification et organisation', 'Il/elle se sent dépassé(e) face à une tâche complexe'),

-- Auto-régulation
('Auto-régulation', 'L''enfant ne vérifie pas son travail avant de le rendre'),
('Auto-régulation', 'Il/elle fait souvent des erreurs d''inattention'),
('Auto-régulation', 'Il/elle ne se rend pas compte que son comportement dérange les autres'),
('Auto-régulation', 'Il/elle ne remarque pas les conséquences de ses actes avant qu''il ne soit trop tard'),
('Auto-régulation', 'Il/elle ne réfléchit pas avant de prendre une décision importante'),
('Auto-régulation', 'Il/elle ne fait pas d''effort pour améliorer son travail après une correction'),
('Auto-régulation', 'Il/elle parle trop fort sans se rendre compte de son impact'),
('Auto-régulation', 'Il/elle ne corrige pas ses erreurs lorsqu''on lui en fait la remarque'),
('Auto-régulation', 'Il/elle ne s''organise pas pour équilibrer travail et loisirs'),
('Auto-régulation', 'Il/elle n''adapte pas son comportement selon les situations');

-- Recréer la contrainte de clé étrangère
ALTER TABLE evaluations
  ADD CONSTRAINT evaluations_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES questions(id);
