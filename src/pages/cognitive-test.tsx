import { useState, useEffect } from 'react';
import { Brain, Heart, Settings, ClipboardList, Package, CheckCircle, ChevronRight, Shield, Shuffle, Database, Save, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EXERCISES = [
  {
    id: 1,
    title: 'Inhibition',
    description: 'Évaluation de la capacité à contrôler les réponses automatiques',
    duration: 7,
    icon: Shield,
    questions: [
      'J\'ai du mal à rester assis calmement lorsque je dois me concentrer.',
      'Je prends souvent la parole sans attendre mon tour.',
      'J\'ai du mal à attendre avant de parler ou d\'agir.',
      'J\'interromps les conversations sans réfléchir.',
      'J\'agis parfois de manière impulsive sans penser aux conséquences.',
      'Je me lève au mauvais moment même quand je devrais rester assis.',
      'Je réagis souvent plus vite que les autres sans réfléchir.',
      'Je parle à voix haute sans toujours m\'en rendre compte.',
      'Je parle trop fort dans certaines situations.',
      'Je prends la parole à des moments inopportuns sans y penser.'
    ]
  },
  {
    id: 2,
    title: 'Flexibilité cognitive',
    description: 'Évaluation de l\'adaptabilité mentale',
    duration: 8,
    icon: Shuffle,
    questions: [
      'J\'ai du mal à changer de méthode quand une tâche devient difficile.',
      'Je préfère utiliser la même approche même si elle ne fonctionne pas.',
      'J\'ai du mal à accepter les changements imprévus.',
      'Il me faut du temps pour m\'adapter aux nouvelles situations.',
      'Je suis dérangé lorsque je change d\'enseignant ou de groupe.',
      'J\'ai du mal à me détacher d\'une idée ou d\'une activité.',
      'Je n\'aime pas qu\'on modifie mes habitudes.',
      'Un changement de routine me contrarie.',
      'Je préfère garder mes propres méthodes plutôt que d\'en essayer de nouvelles.',
      'J\'ai du mal à envisager d\'autres façons de faire.'
    ]
  },
  {
    id: 3,
    title: 'Contrôle Émotionnel',
    description: 'Évaluation de la gestion et modulation des réponses émotionnelles',
    duration: 5,
    icon: Heart,
    questions: [
      'Je réagis fortement même à de petits problèmes.',
      'J\'ai des accès de colère soudains.',
      'Je pleure facilement quand je suis contrarié.',
      'Je change d\'humeur rapidement sans raison apparente.',
      'Je suis très sensible aux critiques.',
      'J\'ai du mal à me calmer après une contrariété.',
      'J\'ai parfois du mal à gérer mes émotions.',
      'Mes réactions émotionnelles sont parfois excessives.',
      'Je garde longtemps en mémoire les choses qui m\'ont contrarié.',
      'Les petits changements peuvent provoquer une forte réaction chez moi.'
    ]
  },
  {
    id: 4,
    title: 'Auto-régulation',
    description: 'Évaluation de la capacité à surveiller et adapter son comportement',
    duration: 7,
    icon: Settings,
    questions: [
      'Je ne réalise pas toujours l\'effet de mon comportement sur les autres.',
      'Je prends conscience de mes erreurs seulement quand on me les signale.',
      'Je ne remarque pas toujours quand mon comportement dérange.',
      'J\'ai du mal à savoir ce que je fais bien ou mal.',
      'Je ne me rends pas compte si mes actions ont un impact négatif.',
      'J\'ai du mal à ajuster mon comportement selon la situation.',
      'Même après une correction, je ne modifie pas toujours mes actions.'
    ]
  },
  {
    id: 5,
    title: 'Mémoire de Travail',
    description: 'Évaluation de la manipulation d\'informations temporaires',
    duration: 10,
    icon: Database,
    questions: [
      'J\'oublie parfois des consignes quand on m\'en donne plusieurs à la fois.',
      'J\'ai du mal à me concentrer longtemps sur une tâche.',
      'Je perds du temps à me rappeler ce que je dois faire.',
      'J\'oublie souvent où j\'ai mis mes affaires.',
      'J\'ai besoin qu\'on me répète les consignes plusieurs fois.',
      'Je me souviens difficilement des nouvelles informations.',
      'Je perds parfois le fil de mes pensées.',
      'Je me laisse distraire facilement quand il y a beaucoup de bruit.',
      'J\'ai du mal à reprendre une tâche après une interruption.',
      'J\'ai besoin de rappels fréquents pour terminer mon travail.'
    ]
  },
  {
    id: 6,
    title: 'Planification et Organisation',
    description: 'Évaluation des capacités de structuration et de gestion',
    duration: 8,
    icon: ClipboardList,
    questions: [
      'J\'oublie souvent mon matériel scolaire.',
      'Je commence rarement mes devoirs sans aide.',
      'J\'ai du mal à organiser mon temps et mon matériel.',
      'J\'ai du mal à structurer mon travail de façon claire.',
      'Je fais mes devoirs au dernier moment.',
      'J\'évalue mal le temps nécessaire pour une tâche.',
      'Je perds souvent des objets importants.',
      'J\'oublie fréquemment de rendre mes devoirs à temps.',
      'Je ne planifie pas mes activités scolaires en avance.',
      'Je me sens vite dépassé par les tâches complexes.'
    ]
  },
  {
    id: 7,
    title: 'Organisation du Matériel',
    description: 'Évaluation de l\'organisation des ressources et de l\'espace',
    duration: 6,
    icon: Package,
    questions: [
      'Mon espace de travail est souvent en désordre.',
      'Je perds régulièrement mes affaires.',
      'J\'oublie souvent d\'emporter le matériel nécessaire.',
      'J\'ai du mal à ranger mes affaires correctement.',
      'Je laisse souvent du désordre après avoir travaillé.',
      'Je mets du temps à retrouver ce dont j\'ai besoin.',
      'Mon cartable ou sac est mal organisé.',
      'Je perds du temps à chercher des objets que je viens d\'utiliser.',
      'J\'ai besoin d\'aide pour garder mon espace propre.',
      'Je laisse traîner mes affaires un peu partout.'
    ]
  },
  {
    id: 8,
    title: 'Achèvement des Tâches',
    description: 'Évaluation de la persévérance et de la completion des objectifs',
    duration: 6,
    icon: CheckCircle,
    questions: [
      'J\'ai du mal à terminer des projets longs.',
      'Je finis rarement une tâche sans aide.',
      'Je mets plus de temps que les autres pour finir mon travail.',
      'Je commence une tâche mais j\'ai du mal à la terminer.',
      'Je me laisse distraire avant d\'avoir fini un travail.',
      'Je repousse souvent mes devoirs et obligations.',
      'Je n\'arrive pas toujours à aller au bout de ce que je commence.',
      'Lors des évaluations, j\'ai du mal à montrer ce que je sais.',
      'Je n\'ai pas toujours des résultats à la hauteur de mes capacités.',
      'Une tâche compliquée me décourage rapidement.'
    ]
  }
];

const FREQUENCY_OPTIONS = [
  { value: 0, label: 'Jamais' },
  { value: 1, label: 'Parfois' },
  { value: 2, label: 'Souvent' },
  { value: 3, label: 'Très souvent' }
];

interface EvaluationForm {
  evaluatorName: string;
  subjectName: string;
  date: string;
  answers: Record<string, {
    score: number;
    notes: string;
  }>;
  generalComments: string;
}

const initialFormState: EvaluationForm = {
  evaluatorName: '',
  subjectName: '',
  date: new Date().toISOString().split('T')[0],
  answers: {},
  generalComments: ''
};

export function CognitiveTest() {
  const [step, setStep] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [form, setForm] = useState<EvaluationForm>(initialFormState);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const savedForm = localStorage.getItem('evaluationForm');
    if (savedForm) {
      setForm(JSON.parse(savedForm));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('evaluationForm', JSON.stringify(form));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSubmit = () => {
    // TODO: Implement form submission to the database
    console.log('Form submitted:', form);
    localStorage.removeItem('evaluationForm');
    setStep(0);
    setForm(initialFormState);
  };

  const updateAnswer = (questionId: string, field: 'score' | 'notes', value: number | string) => {
    setForm(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: {
          ...prev.answers[questionId] || { score: 0, notes: '' },
          [field]: value
        }
      }
    }));
  };

  if (step === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Évaluation des Fonctions Exécutives
          </h1>
          <p className="mt-2 text-gray-600">
            Durée totale estimée : {EXERCISES.reduce((acc, ex) => acc + ex.duration, 0)} minutes
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Avant de commencer</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-primary mr-2">•</span>
                Installez-vous dans un endroit calme
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-primary mr-2">•</span>
                Prévoyez environ {EXERCISES.reduce((acc, ex) => acc + ex.duration, 0)} minutes sans interruption
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 h-6 w-6 text-primary mr-2">•</span>
                Lisez attentivement les instructions de chaque exercice
              </li>
            </ul>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {EXERCISES.map((exercise) => (
              <div key={exercise.id} className="bg-white rounded-lg shadow-md p-6 card-hover">
                <exercise.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{exercise.title}</h3>
                <p className="text-gray-600 mb-4">{exercise.description}</p>
                <p className="text-sm text-gray-500">
                  {exercise.questions.length} questions • {exercise.duration} minutes
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Informations de l'évaluation</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'évaluateur
                  </label>
                  <input
                    type="text"
                    value={form.evaluatorName}
                    onChange={(e) => setForm(prev => ({ ...prev, evaluatorName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la personne évaluée
                  </label>
                  <input
                    type="text"
                    value={form.subjectName}
                    onChange={(e) => setForm(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de l'évaluation
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              onClick={() => setStep(1)}
              disabled={!form.evaluatorName || !form.subjectName}
              className="group bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Commencer l'évaluation
              <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isReviewing) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Révision de l'évaluation
          </h1>
          <p className="mt-2 text-gray-600">
            Vérifiez vos réponses avant de soumettre l'évaluation
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Informations générales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Évaluateur</p>
                <p className="font-medium">{form.evaluatorName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Personne évaluée</p>
                <p className="font-medium">{form.subjectName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{new Date(form.date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {EXERCISES.map((exercise) => (
            <div key={exercise.id} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-2">{exercise.title}</h3>
              <div className="space-y-4">
                {exercise.questions.map((question, index) => {
                  const answer = form.answers[`${exercise.id}-${index}`];
                  return (
                    <div key={index} className="border-b pb-4">
                      <p className="text-gray-600 mb-2">{question}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">
                          Score : {FREQUENCY_OPTIONS[answer?.score || 0].label}
                        </p>
                        {answer?.notes && (
                          <p className="text-sm text-gray-500">
                            Note : {answer.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-2">Commentaires généraux</h3>
            <p className="text-gray-600">{form.generalComments || 'Aucun commentaire'}</p>
          </div>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsReviewing(false)}
              className="flex items-center"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Retour à l'évaluation
            </Button>
            <Button
              size="lg"
              onClick={handleSubmit}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Soumettre l'évaluation
              <Send className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const exercise = EXERCISES[currentExercise];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {exercise.title}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className={`flex items-center gap-2 ${isSaved ? 'text-green-600' : ''}`}
          >
            <Save className="h-4 w-4" />
            {isSaved ? 'Sauvegardé' : 'Sauvegarder'}
          </Button>
        </div>
        <p className="mt-2 text-gray-600">{exercise.description}</p>
      </div>

      <div className="space-y-8">
        {exercise.questions.map((question, index) => {
          const questionId = `${exercise.id}-${index}`;
          const answer = form.answers[questionId] || { score: 0, notes: '' };

          return (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium mb-4">{question}</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Fréquence</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {FREQUENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateAnswer(questionId, 'score', option.value)}
                        className={`px-4 py-2 rounded-md border transition-colors ${
                          answer.score === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes et observations
                  </label>
                  <textarea
                    value={answer.notes}
                    onChange={(e) => updateAnswer(questionId, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
                    placeholder="Ajoutez vos observations..."
                  />
                </div>
              </div>
            </div>
          );
        })}

        {currentExercise === EXERCISES.length - 1 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium mb-4">Commentaires généraux</h3>
            <textarea
              value={form.generalComments}
              onChange={(e) => setForm(prev => ({ ...prev, generalComments: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px] resize-y"
              placeholder="Ajoutez vos commentaires généraux sur l'évaluation..."
            />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              if (currentExercise > 0) {
                setCurrentExercise(prev => prev - 1);
              } else {
                setStep(0);
              }
            }}
            className="flex items-center"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            {currentExercise > 0 ? 'Exercice précédent' : 'Retour à l\'accueil'}
          </Button>

          {currentExercise === EXERCISES.length - 1 ? (
            <Button
              size="lg"
              onClick={() => setIsReviewing(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Réviser l'évaluation
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={() => setCurrentExercise(prev => prev + 1)}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              Exercice suivant
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
