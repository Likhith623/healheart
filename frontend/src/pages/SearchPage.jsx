import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Package,
  IndianRupee,
  ExternalLink,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import useLocationStore from '../store/locationStore';
import useAuthStore from '../store/authStore';
import { searchMedicines, logSearch } from '../lib/supabase';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Map center component
const MapCenterController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
};

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [radius, setRadius] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);

  const { userLocation, getUserLocation, isLocating, locationError } = useLocationStore();
  const { user } = useAuthStore();

  // Get user location on mount
  useEffect(() => {
    if (!userLocation) {
      getUserLocation().catch(() => {
        // Set default location (India)
        useLocationStore.getState().setLocation(20.5937, 78.9629);
      });
    }
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a medicine name');
      return;
    }

    if (!userLocation) {
      toast.error('Please enable location access');
      return;
    }

    setLoading(true);
    setSearched(true);
    setSelectedResult(null);

    try {
      const searchResults = await searchMedicines(
        searchQuery,
        userLocation.lat,
        userLocation.lng,
        radius
      );

      setResults(searchResults);

      // Log search if user is logged in
      if (user) {
        await logSearch(
          user.id,
          searchQuery,
          userLocation.lat,
          userLocation.lng,
          searchResults.length
        );
      }

      if (searchResults.length === 0) {
        toast('No medicines found nearby', { icon: '🔍' });
      } else {
        toast.success(`Found ${searchResults.length} results`);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDirections = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleResultClick = (result) => {
    setSelectedResult(result);
    setMapCenter([parseFloat(result.stores.latitude), parseFloat(result.stores.longitude)]);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Find <span className="gradient-text">Medicines</span> Near You
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            Search for any medicine and discover nearby pharmacies with available stock.
            Get directions to the nearest store instantly.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-8"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter medicine name (e.g., Paracetamol, Insulin)..."
                  className="glass-input pl-12"
                />
              </div>

              {/* Filter Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFilters(!showFilters)}
                className="glass-button-secondary flex items-center gap-2 justify-center"
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Filters</span>
              </motion.button>

              {/* Search Button */}
              <motion.button
                type="submit"
                disabled={loading || isLocating}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="glass-button flex items-center gap-2 justify-center min-w-[140px]"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Search size={20} />
                    <span>Search</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4 border-t border-white/10"
                >
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1">
                      <label className="block text-sm text-white/70 mb-2">
                        Search Radius: {radius} km
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={radius}
                        onChange={(e) => setRadius(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <MapPin size={16} />
                      {userLocation ? (
                        <span className="text-green-400">Location enabled</span>
                      ) : (
                        <span className="text-yellow-400">Enabling location...</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Location Error */}
          {locationError && (
            <div className="mt-4 flex items-center gap-2 text-yellow-400 text-sm">
              <AlertCircle size={16} />
              <span>{locationError}</span>
            </div>
          )}
        </motion.div>

        {/* Results Section */}
        {searched && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4 h-[500px] order-2 lg:order-1"
            >
              {mapCenter && (
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="w-full h-full rounded-xl"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterController center={mapCenter} />

                  {/* User Location Marker */}
                  {userLocation && (
                    <Marker
                      position={[userLocation.lat, userLocation.lng]}
                      icon={userIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <strong>Your Location</strong>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Store Markers */}
                  {results.map((result) => (
                    <Marker
                      key={result.id}
                      position={[
                        parseFloat(result.stores.latitude),
                        parseFloat(result.stores.longitude),
                      ]}
                      icon={storeIcon}
                      eventHandlers={{
                        click: () => handleResultClick(result),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <h3 className="font-semibold text-gray-900">
                            {result.stores.store_name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.name}
                          </p>
                          <p className="text-sm font-medium text-green-600 mt-1">
                            ₹{result.price} • {result.quantity} in stock
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {result.distance_km} km away
                          </p>
                          <button
                            onClick={() =>
                              openDirections(
                                result.stores.latitude,
                                result.stores.longitude
                              )
                            }
                            className="mt-2 w-full bg-blue-500 text-white py-1 px-2 rounded text-sm hover:bg-blue-600"
                          >
                            Get Directions
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </motion.div>

            {/* Results List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="order-1 lg:order-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {results.length > 0
                    ? `${results.length} Results Found`
                    : 'No Results'}
                </h2>
                {results.length > 0 && (
                  <span className="text-sm text-white/50">
                    Sorted by distance
                  </span>
                )}
              </div>

              {results.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <AlertCircle size={48} className="mx-auto text-white/30 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Medicines Found</h3>
                  <p className="text-white/60">
                    Try searching with a different name or increase the search
                    radius.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleResultClick(result)}
                      className={`glass-card p-4 cursor-pointer transition-all ${
                        selectedResult?.id === result.id
                          ? 'ring-2 ring-primary-500'
                          : ''
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Medicine Image */}
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {result.image_url ? (
                            <img
                              src={result.image_url}
                              alt={result.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package size={32} className="text-primary-400" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold truncate">
                                {result.name}
                              </h3>
                              {result.generic_name && (
                                <p className="text-sm text-white/50 truncate">
                                  {result.generic_name}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-green-400 font-semibold whitespace-nowrap">
                              <IndianRupee size={16} />
                              {result.price}
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-4 text-sm text-white/70">
                            <span className="flex items-center gap-1">
                              <Package size={14} />
                              {result.quantity} in stock
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {result.distance_km} km
                            </span>
                          </div>

                          <div className="mt-2 pt-2 border-t border-white/10">
                            <p className="text-sm font-medium text-primary-400">
                              {result.stores.store_name}
                            </p>
                            <p className="text-xs text-white/50 truncate">
                              {result.stores.address}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="mt-3 flex items-center gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDirections(
                                  result.stores.latitude,
                                  result.stores.longitude
                                );
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-purple-600 text-sm font-medium"
                            >
                              <Navigation size={16} />
                              Directions
                            </motion.button>

                            <motion.a
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              href={`tel:${result.stores.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                            >
                              <Phone size={18} />
                            </motion.a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Initial State */}
        {!searched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="glass-card p-8 max-w-md mx-auto">
              <Search size={48} className="mx-auto text-white/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Search for Medicines</h3>
              <p className="text-white/60">
                Enter a medicine name above to find nearby pharmacies with
                available stock.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
