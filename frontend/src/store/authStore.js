import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, getProfile, signIn, signUp, signOut } from '../lib/supabase';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      loading: true,
      error: null,

      // Initialize auth state
      initialize: async () => {
        try {
          set({ loading: true });
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const profile = await getProfile(session.user.id);
            set({
              user: session.user,
              session,
              profile,
              loading: false,
              error: null,
            });
          } else {
            set({
              user: null,
              session: null,
              profile: null,
              loading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: error.message,
          });
        }
      },

      // Sign up
      register: async (email, password, fullName, role, phone) => {
        try {
          set({ loading: true, error: null });
          
          const { user, session } = await signUp(email, password, fullName, role, phone);
          
          if (user) {
            // Wait a bit for the trigger to create the profile
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            try {
              const profile = await getProfile(user.id);
              set({
                user,
                session,
                profile,
                loading: false,
              });
            } catch (profileError) {
              // Profile might not be created yet, set basic info
              set({
                user,
                session,
                profile: {
                  id: user.id,
                  email: user.email,
                  full_name: fullName,
                  role: role,
                },
                loading: false,
              });
            }
          }
          
          return { user, session };
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Sign in
      login: async (email, password) => {
        try {
          set({ loading: true, error: null });
          
          const { user, session } = await signIn(email, password);
          
          if (user) {
            const profile = await getProfile(user.id);
            set({
              user,
              session,
              profile,
              loading: false,
            });
          }
          
          return { user, session };
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Sign out
      logout: async () => {
        try {
          set({ loading: true });
          await signOut();
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null,
          });
        } catch (error) {
          set({ loading: false, error: error.message });
          throw error;
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Not authenticated');
          
          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
          
          if (error) throw error;
          
          set({ profile: data });
          return data;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Check if user is retailer
      isRetailer: () => {
        const { profile } = get();
        return profile?.role === 'retailer';
      },

      // Check if user is customer
      isCustomer: () => {
        const { profile } = get();
        return profile?.role === 'customer';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        session: state.session,
      }),
    }
  )
);

// Listen for auth changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    try {
      const profile = await getProfile(session.user.id);
      useAuthStore.setState({
        user: session.user,
        session,
        profile,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching profile on auth change:', error);
    }
  } else if (event === 'SIGNED_OUT') {
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      loading: false,
    });
  }
});

export default useAuthStore;
