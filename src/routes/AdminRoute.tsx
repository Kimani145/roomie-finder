import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import FullScreenLoader from '@/components/ui/FullScreenLoader';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    // If auth state is still loading, wait.
    if (loading) return;

    if (!user) { 
      setIsAdmin(false); 
      return; 
    }

    // Auth is loaded and user exists. Reset admin state to null during fetch.
    setIsAdmin(null);
    getDoc(doc(db, 'admins', user.uid)).then(docSnap => {
      setIsAdmin(docSnap.exists());
    }).catch((err) => { console.error("Admin check failed:", err); setIsAdmin(false); });
  }, [user, loading]);

  if (loading || isAdmin === null) return <FullScreenLoader />;
  return isAdmin ? <>{children}</> : <Navigate to="/discover" replace />;
};
