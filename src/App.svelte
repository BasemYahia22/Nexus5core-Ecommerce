<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from './lib/store.svelte';
  import { fetchProducts } from './services/api';
  import type { Product } from './types';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';

  // Sub-components imports
  import Header from './components/Header.svelte';
  import Sidebar from './components/Sidebar.svelte';
  import ProductCard from './components/ProductCard.svelte';
  import ProductDetails from './components/ProductDetails.svelte';
  import CartSidebar from './components/CartSidebar.svelte';
  import Checkout from './components/Checkout.svelte';
  import UserDashboard from './components/UserDashboard.svelte';
  import AdminDashboard from './components/AdminDashboard.svelte';
  import SkeletonLoader from './components/SkeletonLoader.svelte';
  import Toast from './components/Toast.svelte';

  // State
  let products = $state<Product[]>([]);
  let loadingProducts = $state(true);
  let totalCount = $state(0);
  
  // Pagination State
  let currentPage = $state(1);
  const itemsPerPage = 12; // 12 items is perfect for a multi-column responsive grid

  // Svelte 5 Reactive Effect - Automatically fetches products when category or search changes
  $effect(() => {
    // Read reactive fields to create dependency
    const cat = store.selectedCategory;
    const search = store.searchQuery;

    loadProductsData(cat, search);
  });

  // Reset pagination to page 1 whenever filters change
  $effect(() => {
    store.selectedCategory;
    store.searchQuery;
    store.maxPrice;
    store.sortBy;
    currentPage = 1;
  });

  async function loadProductsData(category: string, search: string) {
    loadingProducts = true;
    try {
      const response = await fetchProducts({
        category: category !== 'all' ? category : undefined,
        searchQuery: search || undefined,
        limit: 100 // fetch a generous batch to support instant local premium filtering, sorting & pagination
      });
      products = response.products;
      totalCount = response.total;
    } catch (err) {
      console.error('Error fetching catalog:', err);
    } finally {
      loadingProducts = false;
    }
  }

  // Derived filtered products based on current price range threshold
  let filteredProducts = $derived(
    products.filter(p => p.price <= store.maxPrice)
  );

  // Derived sorted products based on sorting parameters
  let sortedProducts = $derived(
    [...filteredProducts].sort((a, b) => {
      if (store.sortBy === 'price-asc') return a.price - b.price;
      if (store.sortBy === 'price-desc') return b.price - a.price;
      if (store.sortBy === 'rating-desc') return b.rating - a.rating;
      return 0; // Default order
    })
  );

  // Derived paginated slice of sorted products
  let paginatedProducts = $derived(
    sortedProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  );

  // Derived total pages count
  let totalPages = $derived(
    Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage))
  );

  // Derived list of pages to display, with smart dot-split for many pages
  let pagesList = $derived.by(() => {
    const list: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        list.push(i);
      }
    } else {
      // Always show page 1
      list.push(1);
      
      if (currentPage > 3) {
        list.push('...');
      }
      
      // Determine middle range
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          list.push(i);
        }
      }
      
      if (currentPage < totalPages - 2) {
        list.push('...');
      }
      
      // Always show last page
      list.push(totalPages);
    }
    return list;
  });

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      // Smooth scroll back to top of the catalog section
      const catalogSection = document.getElementById('shop-grid-top');
      if (catalogSection) {
        catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  function handleClearSearch() {
    store.searchQuery = '';
    store.selectedCategory = 'all';
    store.maxPrice = 3000;
    store.sortBy = 'default';
    currentPage = 1;
  }
</script>

<!-- Main Container -->
<div class="min-h-screen bg-[#050505] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden antialiased">
  
  <!-- Header -->
  <Header />

  <!-- Layout / Routing View Handler -->
  {#if store.currentView === 'shop'}
    <!-- CATALOG MAIN LAYOUT -->
    <main class="flex-1 flex flex-col lg:flex-row">
      <!-- Sidebar Filters -->
      <Sidebar />

      <!-- Main Catalog Grid Area -->
      <section id="shop-grid-top" class="flex-1 p-6 md:p-8 flex flex-col min-w-0">
        <!-- Grid Header Options -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
          <div>
            <h2 class="text-3xl font-light tracking-tight text-white uppercase">
              Premium <span class="italic font-serif text-orange-500">Hardware</span>
            </h2>
            <p class="text-slate-500 text-xs mt-1 uppercase tracking-widest font-mono">
              {#if loadingProducts}
                Loading transit cores...
              {:else if sortedProducts.length === 0}
                No hardware cores found
              {:else}
                Showing { (currentPage - 1) * itemsPerPage + 1 }–{ Math.min(currentPage * itemsPerPage, sortedProducts.length) } of { sortedProducts.length } hardware cores
              {/if}
            </p>
          </div>

          <!-- Sorting Actions -->
          <div class="flex gap-2.5 items-center">
            <span class="text-[10px] uppercase font-mono text-slate-500">Sort By</span>
            <select 
              bind:value={store.sortBy}
              class="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold tracking-wider focus:outline-none cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>
        </div>

        <!-- Product Grid -->
        {#if loadingProducts}
          <SkeletonLoader count={6} />
        {:else if sortedProducts.length === 0}
          <div class="text-center py-24 border border-dashed border-white/5 bg-white/[0.01] rounded-3xl">
            <p class="text-slate-400 font-bold mb-2">No hardware matches found</p>
            <p class="text-xs text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
              Try adjusting your query price range or clear filters to reset
            </p>
            <button 
              onclick={handleClearSearch}
              class="px-6 py-2.5 bg-orange-500 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:shadow-[0_4px_15px_rgba(249,115,22,0.4)] transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {#each paginatedProducts as product (product.id)}
              <ProductCard {product} />
            {/each}
          </div>

          <!-- Pagination Navigation Bar -->
          {#if totalPages > 1}
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 pt-8 border-t border-white/10">
              <span class="text-xs text-slate-500 font-mono uppercase tracking-wider">
                Page {currentPage} of {totalPages}
              </span>
              
              <div class="flex items-center gap-1.5">
                <!-- Prev Button -->
                <button 
                  onclick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                  title="Previous Page"
                >
                  <ChevronLeft class="w-4 h-4" />
                </button>

                <!-- Page Buttons / Dots -->
                {#each pagesList as page}
                  {#if page === '...'}
                    <span class="w-8 text-center text-slate-600 text-xs font-bold select-none font-mono">...</span>
                  {:else}
                    <button 
                      onclick={() => goToPage(page)}
                      class="w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center
                        {currentPage === page 
                          ? 'bg-orange-500 text-black border-orange-500 font-black shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white hover:border-white/25'
                        }"
                    >
                      {page}
                    </button>
                  {/if}
                {/each}

                <!-- Next Button -->
                <button 
                  onclick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  class="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center justify-center"
                  title="Next Page"
                >
                  <ChevronRight class="w-4 h-4" />
                </button>
              </div>
            </div>
          {/if}
        {/if}
      </section>
    </main>

  {:else}
    <!-- OTHER DYNAMIC PAGE ROUTES -->
    <main class="flex-1 flex flex-col">
      {#if store.currentView === 'product-details'}
        <ProductDetails />
      {:else if store.currentView === 'checkout'}
        <Checkout />
      {:else if store.currentView === 'dashboard'}
        <UserDashboard />
      {:else if store.currentView === 'admin'}
        <AdminDashboard />
      {/if}
    </main>
  {/if}

  <!-- Cart Sidebar slideout -->
  <CartSidebar />

  <!-- Global Toasts -->
  <Toast />

  <!-- Bottom Status Footer matching design theme -->
  <footer class="h-12 border-t border-white/5 bg-black flex flex-col md:flex-row items-center justify-between px-6 md:px-8 shrink-0 py-3 gap-2">
    <div class="flex items-center gap-6">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></div>
        <span class="text-[10px] font-mono text-slate-500 uppercase tracking-wider">System Operational</span>
      </div>
    </div>
    <div class="text-[10px] font-mono text-slate-400 uppercase tracking-widest text-center font-bold">
      Developed by Basem Yahia
    </div>
  </footer>
</div>

<style>
  /* Hide standard scrollbars to preserve aesthetic */
  :global(.scrollbar-none::-webkit-scrollbar) {
    display: none;
  }
  :global(.scrollbar-none) {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
