<script lang="ts">
  import { auth } from '../services/firebase';
  import { signOut } from 'firebase/auth';
  import { store } from '../lib/store.svelte';
  import { 
    Search, 
    Heart, 
    ShoppingBag, 
    User as UserIcon, 
    Sun, 
    Moon, 
    LogOut, 
    LayoutDashboard, 
    ShieldCheck, 
    Menu, 
    X,
    Sparkles
  } from 'lucide-svelte';
  import AuthModal from './auth/AuthModal.svelte';

  // Toggle mobile navigation menu
  let mobileMenuOpen = $state(false);
  let authOpen = $state(false);
  let profileDropdownOpen = $state(false);

  async function handleLogout() {
    try {
      await signOut(auth);
      store.addToast('Successfully logged out!', 'info');
      store.currentView = 'shop';
      profileDropdownOpen = false;
    } catch (err: any) {
      console.error(err);
      store.addToast('Logout failed', 'error');
    }
  }

  function navigateTo(view: 'shop' | 'product-details' | 'checkout' | 'dashboard' | 'admin') {
    store.currentView = view;
    mobileMenuOpen = false;
    profileDropdownOpen = false;
  }

  // Handle outside click for dropdown
  function closeDropdowns() {
    profileDropdownOpen = false;
  }
</script>

<nav class="h-20 border-b border-white/10 flex items-center justify-between px-4 sm:px-6 md:px-8 bg-black/40 backdrop-blur-md z-50 sticky top-0">
  <!-- Brand Logo -->
  <div class="flex items-center gap-8">
    <button 
      onclick={() => navigateTo('shop')}
      class="flex items-center gap-2 text-left cursor-pointer"
    >
      <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-black shadow-[0_0_15px_rgba(249,115,22,0.5)]">N</div>
      <span class="text-base sm:text-lg md:text-xl font-bold tracking-tight text-white uppercase whitespace-nowrap">
        NEXUS<span class="text-orange-500 underline decoration-2 underline-offset-4 font-black italic">5</span> <span class="hidden sm:inline">CORE</span>
      </span>
    </button>

    <!-- Desktop Navigation Links -->
    <div class="hidden md:flex gap-6 text-xs font-semibold uppercase tracking-widest text-slate-400">
      <button 
        onclick={() => navigateTo('shop')}
        class="hover:text-white transition-all cursor-pointer"
        class:text-white={store.currentView === 'shop' || store.currentView === 'product-details'}
        class:border-b={store.currentView === 'shop' || store.currentView === 'product-details'}
        class:border-orange-500={store.currentView === 'shop' || store.currentView === 'product-details'}
        class:pb-1={store.currentView === 'shop' || store.currentView === 'product-details'}
      >
        Shop
      </button>

      {#if store.user}
        <button 
          onclick={() => navigateTo('dashboard')}
          class="hover:text-white transition-all cursor-pointer"
          class:text-white={store.currentView === 'dashboard'}
          class:border-b={store.currentView === 'dashboard'}
          class:border-orange-500={store.currentView === 'dashboard'}
          class:pb-1={store.currentView === 'dashboard'}
        >
          Dashboard
        </button>
      {/if}

      {#if store.user && store.user.role === 'admin'}
        <button 
          onclick={() => navigateTo('admin')}
          class="hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-orange-400"
          class:text-orange-500={store.currentView === 'admin'}
          class:border-b={store.currentView === 'admin'}
          class:border-orange-500={store.currentView === 'admin'}
          class:pb-1={store.currentView === 'admin'}
        >
          <ShieldCheck class="w-4 h-4" />
          Admin
        </button>
      {/if}
    </div>
  </div>

  <!-- Search and Actions -->
  <div class="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
    <!-- Search Bar (Desktop only) -->
    <div class="relative hidden lg:block">
      <Search class="w-4 h-4 text-slate-500 absolute left-4 top-3" />
      <input 
        type="text" 
        placeholder="Search products..." 
        bind:value={store.searchQuery}
        class="bg-white/5 border border-white/10 rounded-full pl-11 pr-4 py-2 w-64 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
      />
      {#if store.searchQuery}
        <button 
          onclick={() => store.searchQuery = ''}
          class="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white"
        >
          ✕
        </button>
      {/if}
    </div>

    <!-- Theme Toggle -->
    <button 
      onclick={() => store.toggleTheme()}
      class="p-2 sm:p-2.5 hover:bg-white/5 border border-white/5 rounded-full cursor-pointer transition-colors text-slate-400 hover:text-white"
      title="Toggle Theme"
    >
      {#if store.theme === 'dark'}
        <Sun class="w-4 h-4 sm:w-5 h-5 text-orange-400" />
      {:else}
        <Moon class="w-4 h-4 sm:w-5 h-5 text-slate-300" />
      {/if}
    </button>

    <!-- Wishlist Button -->
    <button 
      onclick={() => {
        if (!store.user) {
          authOpen = true;
        } else {
          navigateTo('dashboard');
        }
      }}
      class="relative p-2 sm:p-2.5 hover:bg-white/5 border border-white/5 rounded-full cursor-pointer transition-colors text-slate-400 hover:text-white"
      title="Wishlist"
    >
      <Heart class="w-4 h-4 sm:w-5 h-5 {store.wishlist.length > 0 ? 'fill-red-500 text-red-500' : ''}" />
      {#if store.wishlist.length > 0}
        <span class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-orange-500 text-[8px] sm:text-[10px] flex items-center justify-center rounded-full text-black font-black">
          {store.wishlist.length}
        </span>
      {/if}
    </button>

    <!-- Cart Button -->
    <button 
      onclick={() => store.cartOpen = true}
      class="relative p-2 sm:p-2.5 hover:bg-white/5 border border-white/5 rounded-full cursor-pointer transition-colors text-slate-400 hover:text-white"
      title="Shopping Cart"
    >
      <ShoppingBag class="w-4 h-4 sm:w-5 h-5" />
      {#if store.cartTotalItems > 0}
        <span class="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-orange-500 text-[8px] sm:text-[10px] flex items-center justify-center rounded-full text-black font-black shadow-[0_0_8px_rgba(249,115,22,0.4)]">
          {store.cartTotalItems}
        </span>
      {/if}
    </button>

    <!-- User Profile Dropdown -->
    {#if store.loadingUser}
      <div class="w-8 h-8 rounded-full border border-white/10 animate-pulse bg-white/5"></div>
    {:else if store.user}
      <div class="relative">
        <button 
          onclick={() => profileDropdownOpen = !profileDropdownOpen}
          class="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-orange-500/30 overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center cursor-pointer hover:border-orange-500 transition-all"
        >
          {#if store.user.photoURL}
            <img src={store.user.photoURL} alt={store.user.displayName} class="w-full h-full object-cover" />
          {:else}
            <span class="text-orange-500 font-bold text-sm italic uppercase">
              {store.user.displayName ? store.user.displayName.slice(0, 2) : 'US'}
            </span>
          {/if}
        </button>

        <!-- Dropdown Menu -->
        {#if profileDropdownOpen}
          <div class="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0d0d0d] border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div class="px-4 py-3 border-b border-white/5 mb-2">
              <p class="text-xs text-slate-500 uppercase tracking-widest font-mono">Signed in as</p>
              <p class="text-sm font-semibold text-white truncate mt-0.5">{store.user.displayName}</p>
              <p class="text-[10px] text-slate-400 truncate">{store.user.email}</p>
            </div>
            
            <button 
              onclick={() => navigateTo('dashboard')}
              class="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm text-slate-300 hover:text-white flex items-center gap-3 transition-colors cursor-pointer"
            >
              <UserIcon class="w-4 h-4 text-slate-400" />
              My Profile
            </button>

            {#if store.user.role === 'admin'}
              <button 
                onclick={() => navigateTo('admin')}
                class="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 text-sm text-orange-400 hover:text-orange-300 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <LayoutDashboard class="w-4 h-4 text-orange-400" />
                Admin Panel
              </button>
            {/if}

            <div class="border-t border-white/5 my-2"></div>

            <button 
              onclick={handleLogout}
              class="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-500/10 text-sm text-red-400 hover:text-red-300 flex items-center gap-3 transition-colors cursor-pointer"
            >
              <LogOut class="w-4 h-4" />
              Logout
            </button>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Login Button -->
      <button 
        onclick={() => authOpen = true}
        class="bg-orange-500 text-black px-3 py-1.5 sm:px-5 sm:py-2 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 shadow-[0_4px_15px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_25px_rgba(249,115,22,0.5)] transition-all cursor-pointer whitespace-nowrap"
      >
        Login
      </button>
    {/if}

    <!-- Mobile Menu Burger -->
    <button 
      onclick={() => mobileMenuOpen = !mobileMenuOpen}
      class="p-1 sm:p-2 text-slate-400 hover:text-white md:hidden block cursor-pointer"
    >
      {#if mobileMenuOpen}
        <X class="w-5 h-5 sm:w-6 sm:h-6" />
      {:else}
        <Menu class="w-5 h-5 sm:w-6 sm:h-6" />
      {/if}
    </button>
  </div>
</nav>

<!-- Mobile Navigation Sidebar -->
{#if mobileMenuOpen}
  <div class="fixed inset-0 top-20 bg-black/95 z-40 md:hidden flex flex-col p-8 gap-8 animate-in slide-in-from-right duration-300">
    <!-- Search Bar in mobile -->
    <div class="relative w-full">
      <Search class="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
      <input 
        type="text" 
        placeholder="Search products..." 
        bind:value={store.searchQuery}
        class="bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 w-full text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-500"
      />
    </div>

    <!-- Mobile Navigation Links -->
    <div class="flex flex-col gap-6 text-lg font-medium tracking-wide uppercase">
      <button 
        onclick={() => navigateTo('shop')}
        class="text-left py-2 border-b border-white/5 cursor-pointer"
        class:text-orange-500={store.currentView === 'shop' || store.currentView === 'product-details'}
      >
        Shop
      </button>

      {#if store.user}
        <button 
          onclick={() => navigateTo('dashboard')}
          class="text-left py-2 border-b border-white/5 cursor-pointer"
          class:text-orange-500={store.currentView === 'dashboard'}
        >
          Dashboard
        </button>
      {/if}

      {#if store.user && store.user.role === 'admin'}
        <button 
          onclick={() => navigateTo('admin')}
          class="text-left py-2 border-b border-white/5 text-orange-400 flex items-center gap-2 cursor-pointer"
          class:text-orange-500={store.currentView === 'admin'}
        >
          <ShieldCheck class="w-5 h-5" />
          Admin Panel
        </button>
      {/if}
    </div>
  </div>
{/if}

<!-- Single Instance of Auth Modal -->
<AuthModal bind:isOpen={authOpen} />
