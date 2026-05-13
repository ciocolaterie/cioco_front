import { useEffect } from 'react';
import AppRouter from './routing/AppRouter.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { useCart } from './context/CartContext.jsx';

function FavoriteSync() {
  const { user } = useAuth();
  const { initFavorites } = useCart();
  useEffect(() => {
    if (user?.favorites?.length) {
      initFavorites(user.favorites.map(String));
    }
  }, [user?._id]); // eslint-disable-line
  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <FavoriteSync />
      <AppRouter />
    </ErrorBoundary>
  );
}
