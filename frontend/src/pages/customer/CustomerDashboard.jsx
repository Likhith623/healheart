import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Heart,
  Bell,
  Clock,
  MapPin,
  TrendingUp,
  Store,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const CustomerDashboard = () => {
  const { profile, user } = useAuthStore();
  const [stats, setStats] = useState({
    totalSearches: 0,
    favoriteStores: 0,
    activeAlerts: 0,
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch recent searches
      const { data: searches } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSearches(searches || []);

      // Fetch favorites with store details
      const { data: favs } = await supabase
        .from('favorites')
        .select('*, stores(*)')
        .eq('user_id', user.id)
        .limit(3);

      setFavorites(favs || []);

      // Count stats
      const { count: searchCount } = await supabase
        .from('search_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: favCount } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: alertCount } = await supabase
        .from('medicine_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);

      setStats({
        totalSearches: searchCount || 0,
        favoriteStores: favCount || 0,
        activeAlerts: alertCount || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Searches',
      value: stats.totalSearches,
      icon: Search,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Favorite Stores',
      value: stats.favoriteStores,
      icon: Heart,
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Active Alerts',
      value: stats.activeAlerts,
      icon: Bell,
      color: 'from-purple-500 to-violet-500',
    },
  ];

  const quickActions = [
    {
      title: 'Search Medicine',
      description: 'Find medicines near you',
      icon: Search,
      link: '/search',
      color: 'from-primary-500 to-cyan-500',
    },
    {
      title: 'View Favorites',
      description: 'Your saved pharmacies',
      icon: Heart,
      link: '/customer/favorites',
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Set Alerts',
      description: 'Get notified when available',
      icon: Bell,
      link: '/customer/alerts',
      color: 'from-purple-500 to-violet-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{' '}
            <span className="gradient-text">
              {profile?.full_name?.split(' ')[0] || 'User'}
            </span>
            !
          </h1>
          <p className="text-white/60">
            Find life-saving medicines near you in seconds.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                >
                  <stat.icon size={24} className="text-white" />
                </div>
                <TrendingUp size={20} className="text-green-400" />
              </div>
              <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
              <p className="text-white/60 text-sm">{stat.title}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-4">Quick Search</h2>
          <Link to="/search">
            <div className="glass-input flex items-center gap-3 cursor-pointer hover:border-primary-500 transition-colors">
              <Search size={20} className="text-white/50" />
              <span className="text-white/50">Search for medicines...</span>
            </div>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Searches */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock size={20} />
                Recent Searches
              </h2>
            </div>

            {recentSearches.length === 0 ? (
              <div className="text-center py-8">
                <Search size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/50">No recent searches</p>
                <Link
                  to="/search"
                  className="text-primary-400 text-sm hover:underline mt-2 inline-block"
                >
                  Start searching
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSearches.map((search, index) => (
                  <Link
                    key={search.id}
                    to={`/search?q=${encodeURIComponent(search.search_query)}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center">
                        <Search size={18} className="text-primary-400" />
                      </div>
                      <div>
                        <p className="font-medium">{search.search_query}</p>
                        <p className="text-xs text-white/50">
                          {search.results_count} results •{' '}
                          {new Date(search.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/30" />
                  </Link>
                ))}
              </div>
            )}
          </motion.div>

          {/* Favorite Stores */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Heart size={20} />
                Favorite Stores
              </h2>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-8">
                <Heart size={40} className="mx-auto text-white/20 mb-3" />
                <p className="text-white/50">No favorite stores yet</p>
                <p className="text-white/30 text-sm mt-1">
                  Save stores while searching
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-600/20 flex items-center justify-center">
                        <Store size={18} className="text-pink-400" />
                      </div>
                      <div>
                        <p className="font-medium">{fav.stores?.store_name}</p>
                        <p className="text-xs text-white/50 flex items-center gap-1">
                          <MapPin size={12} />
                          {fav.stores?.city}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs ${
                        fav.stores?.is_open
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {fav.stores?.is_open ? 'Open' : 'Closed'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link key={action.title} to={action.link}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="glass-card p-6 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <action.icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-semibold mb-1">{action.title}</h3>
                  <p className="text-sm text-white/50">{action.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Emergency Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 glass-card p-6 border-l-4 border-red-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-red-400 mb-1">
                Emergency Helpline
              </h3>
              <p className="text-white/70 text-sm">
                In case of a medical emergency, please call{' '}
                <strong className="text-white">108</strong> or visit your nearest
                hospital immediately. This app helps locate medicines but is not a
                substitute for emergency medical care.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
