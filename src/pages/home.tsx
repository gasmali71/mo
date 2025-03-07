import { Brain, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Home() {
  return (
    <div className="relative isolate">
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-secondary opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-4xl py-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent sm:text-4xl mb-8">
            Évaluez et Améliorez vos Fonctions Cognitives
          </h1>
          <div className="flex justify-center animate-float mb-8">
            <Brain className="h-20 w-20 text-primary" />
          </div>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            NeuronalFit propose des outils d'évaluation cognitive professionnels pour les enfants, 
            générant des rapports personnalisés et des recommandations ciblées pour soutenir leur développement.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link to="/test">
              <Button size="lg" className="group bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all duration-300">
                Commencer l'évaluation
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10"
              >
                Voir le tableau de bord
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
