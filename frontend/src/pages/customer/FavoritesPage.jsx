import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Heart,
  Store,
  MapPin,
  Phone,
  Star,
  Trash2,
  ExternalLink,
  Search,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const FavoritesPage = () => {
  const { user } = useAuthStore();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          created_at,
          stores (
            id,
            store_name,
            address,
            city,
            phone,
            rating,
            image_url,
            is_open
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;
      
      setFavorites(favorites.filter((f) => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Favorite</span> Stores
          </h1>
          <p className="text-white/60 mt-2">
            Your saved pharmacy stores for quick access
          </p>
        </motion.div>

        {favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <Heart size={64} className="mx-auto text-white/20 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Favorites Yet</h3>
            <p className="text-white/50 mb-6">
              Start adding stores to your favorites while searching for medicines
            </p>
            <Link to="/search">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-button inline-flex items-center gap-2"
              >
                <Search size={20} />
                <span>Search Medicines</span>
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {favorites.map((fav, index) => (
                <motion.div
                  key={fav.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card overflow-hidden group"
                >
                  {/* Store Image */}
                  <div className="h-40 bg-gradient-to-br from-primary-500/20 to-purple-600/20 relative">
                    {fav.stores?.image_url ? (
                      <img
                        src={fav.stores.image_url}
                        alt={fav.stores.store_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Store size={40} className="text-white/30" />
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div
                      className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${
                        fav.stores?.is_open
                          ? 'bg-green-500/90 text-white'
                          : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {fav.stores?.is_open ? 'Open' : 'Closed'}
                    </div>

                    {/* Heart Icon */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeFavorite(fav.id)}
                      className="absolute top-3 left-3 p-2 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  </div>

                  {/* Store Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg truncate">
                      {fav.stores?.store_name || 'Unknown Store'}
                    </h3>
                    
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start gap-2 text-sm text-white/60">
                        <MapPin size={16} className="flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {fav.stores?.address}, {fav.stores?.city}
                        </span>
                      </div>
                      
                      {fav.stores?.phone && (
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Phone size={16} className="flex-shrink-0" />
                          <span>{fav.stores.phone}</span>
                        </div>
                      )}
                      
                      {fav.stores?.rating && (
                        <div className="flex items-center gap-2 text-sm">
                          <Star size={16} className="text-yellow-400 fill-yellow-400" />
                          <span>{fav.stores.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/search?store=${fav.stores?.id}`}
                        className="flex-1"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full glass-button text-sm flex items-center justify-center gap-2"
                        >
                          <Search size={16} />
                          <span>View Medicines</span>
                        </motion.button>
                      </Link>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${fav.stores?.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="p-3 rounded-xl bg-white/10 hover:bg-white/20"
                        >
                          <ExternalLink size={16} />
                        </motion.button>
                      </a>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
