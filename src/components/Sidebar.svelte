<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { fetchCategories } from '../services/api';
  import type { Category } from '../types';
  import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-svelte';

  let categories = $state<Category[]>([]);
  let loadingCategories = $state(true);
  let showAdvancedFilters = $state(false);

  onMount(async () => {
    try {
      const fetched = await fetchCategories();
      categories = fetched;
    } catch (err) {
      console.error('Error fetching categories in sidebar:', err);
    } finally {
      loadingCategories = false;
    }
  });

  function selectCategory(categorySlug: string) {
    store.selectedCategory = categorySlug;
    store.currentView = 'shop'; // Switch back to catalog if in details
  }

  function resetFilters() {
    store.searchQuery = '';
    store.selectedCategory = 'all';
    store.maxPrice = 3000;
    store.sortBy = 'default';
  }
</script>

<aside class="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 lg:gap-8 shrink-0">
  <!-- Title / Header -->
  <div class="flex items-center justify-between pb-2 border-b border-white/5">
    <div class="flex items-center gap-2">
      <SlidersHorizontal class="w-4 h-4 text-orange-500" />
      <h3 class="text-xs uppercase tracking-[0.2em] text-orange-500 font-black italic">Engine Filters</h3>
    </div>
    
    <!-- Mobile/Tablet Toggle Button for advanced options -->
    <button 
      onclick={() => showAdvancedFilters = !showAdvancedFilters}
      class="lg:hidden px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] uppercase font-bold tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
    >
      <span>Options</span>
      {#if showAdvancedFilters}
        <ChevronUp class="w-3.5 h-3.5 text-orange-500" />
      {:else}
        <ChevronDown class="w-3.5 h-3.5 text-slate-400" />
      {/if}
    </button>
  </div>

  <!-- Search (Shown in sidebar on tablet/mobile where header search is hidden, inside collapsible area on mobile) -->
  <div class="space-y-2 {showAdvancedFilters ? 'block' : 'hidden lg:block'}">
    <label for="search-side" class="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Quick Query</label>
    <input 
      id="search-side"
      type="text" 
      placeholder="Search..." 
      bind:value={store.searchQuery}
      class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600"
    />
  </div>

  <!-- Categories: Always visible and easily swipable/scrollable on mobile, list-style on desktop -->
  <div>
    <h4 class="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-mono mb-3 lg:mb-4">Categories</h4>
    
    {#if loadingCategories}
      <div class="flex lg:flex-col gap-2 overflow-x-auto pb-3 lg:pb-0 scrollbar-none">
        <div class="h-8 bg-white/5 rounded-xl w-24 lg:w-full shrink-0 animate-pulse"></div>
        <div class="h-8 bg-white/5 rounded-xl w-24 lg:w-3/4 shrink-0 animate-pulse"></div>
        <div class="h-8 bg-white/5 rounded-xl w-24 lg:w-5/6 shrink-0 animate-pulse"></div>
      </div>
    {:else}
      <div class="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 scrollbar-none snap-x max-h-[350px] lg:overflow-y-auto pr-1">
        <!-- 'All' Category -->
        <button 
          onclick={() => selectCategory('all')}
          class="px-4 py-2 rounded-xl text-[10px] lg:text-xs uppercase font-bold tracking-widest border transition-all duration-200 cursor-pointer text-left whitespace-nowrap snap-start shrink-0 lg:w-full {store.selectedCategory === 'all' ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}"
        >
          All Categories
        </button>

        {#each categories as cat}
          <button 
            onclick={() => selectCategory(cat.slug)}
            class="px-4 py-2 rounded-xl text-[10px] lg:text-xs uppercase font-bold tracking-widest border transition-all duration-200 cursor-pointer text-left whitespace-nowrap snap-start shrink-0 lg:w-full {store.selectedCategory === cat.slug ? 'border-orange-500 bg-orange-500 text-black' : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'}"
          >
            {cat.name}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Advanced Filters (Price threshold and reset) - collapsible on mobile/tablet -->
  <div class="flex flex-col gap-6 lg:gap-8 {showAdvancedFilters ? 'flex' : 'hidden lg:flex'}">
    <!-- Price Limit -->
    <div>
      <div class="flex justify-between items-center mb-3">
        <h4 class="text-[10px] uppercase tracking-[0.15em] text-slate-500 font-mono">Price Threshold</h4>
        <span class="text-xs font-mono text-orange-400 font-bold">${store.maxPrice}</span>
      </div>
      
      <div class="relative pt-2">
        <input 
          type="range" 
          min="0" 
          max="3000" 
          step="10"
          bind:value={store.maxPrice}
          class="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-orange-500 focus:outline-none"
        />
        <div class="flex justify-between text-[10px] font-mono text-slate-600 mt-2">
          <span>$0</span>
          <span>$1,500</span>
          <span>$3,000</span>
        </div>
      </div>
    </div>

    <!-- Reset Filters Button -->
    <button 
      onclick={resetFilters}
      class="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
    >
      Clear Filters
    </button>

    <!-- Quote Card (Immersive UI theme highlight) -->
    <div class="mt-auto hidden lg:block p-5 bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl relative overflow-hidden">
      <!-- Glowing background light -->
      <div class="absolute -right-12 -bottom-12 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full"></div>
      
      <p class="text-xs text-slate-300 leading-relaxed mb-3 italic">
        "Our state-of-the-art cores provide unparalleled performance and precision control for next-generation systems."
      </p>
      <span class="text-[10px] text-orange-500 font-bold uppercase tracking-widest">
        - Lead Architect
      </span>
    </div>
  </div>
</aside>
