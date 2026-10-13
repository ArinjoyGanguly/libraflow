import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="p-4 rounded-3xl bg-indigo-950/40 border border-indigo-800/50 text-indigo-400 mb-4 animate-bounce">
        <Compass className="w-10 h-10" />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">404 — Node Not Found</h1>
      <p className="text-xs text-slate-400 max-w-md mt-2 mb-6">
        The requested URL path does not exist in the LibraFlow routing registry or was moved.
      </p>
      <Button
        leftIcon={<ArrowLeft className="w-4 h-4" />}
        onClick={() => navigate('/')}
      >
        Return to Dashboard
      </Button>
    </div>
  );
};
