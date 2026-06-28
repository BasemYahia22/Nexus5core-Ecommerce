<script lang="ts">
  import { store } from '../lib/store.svelte';
  import type { Product } from '../types';
  import { Heart, ShoppingCart, Star } from 'lucide-svelte';

  // Svelte 5 props
  let { product }: { product: Product } = $props();

  // Derived properties using standard JS getters inside Svelte 5
  let isWishlisted = $derived(store.wishlist.includes(product.id));
  
  // Calculate original price if discount exists
  let discountedPrice = $derived(product.price);
  let originalPrice = $derived(
    product.discountPercentage 
      ? Math.round(product.price / (1 - (product.discountPercentage / 100))) 
      : null
  );

  function handleViewDetails() {
    store.selectedProductId = product.id;
    store.currentView = 'product-details';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleAddToCart(e: Event) {
    e.stopPropagation();
    store.addToCart(product);
  }

  function handleToggleWishlist(e: Event) {
    e.stopPropagation();
    store.toggleWishlist(product);
  }
</script>

<div 
  onclick={handleViewDetails}
  class="bg-[#0d0d0d] border border-white/10 rounded-3xl p-5 flex flex-col relative group overflow-hidden cursor-pointer hover:border-orange-500/50 hover:shadow-[0_10px_30px_rgba(249,115,22,0.1)] transition-all duration-300 h-full select-none"
  role="button"
  tabindex="0"
  onkeydown={(e) => { if (e.key === 'Enter') handleViewDetails(); }}
>
  <!-- Ambient orange glowing aura behind card -->
  <div class="absolute -top-16 -right-16 w-36 h-36 bg-orange-500/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-all duration-300"></div>

  <!-- Image and Badges -->
  <div class="h-44 md:h-48 bg-white/5 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden shrink-0">
    <img 
      src={product.thumbnail} 
      alt={product.title} 
      class="w-32 h-32 md:w-36 md:h-36 object-contain group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
      loading="lazy"
    />

    <!-- Discount Badge -->
    {#if product.discountPercentage && product.discountPercentage > 0}
      <span class="absolute top-3 left-3 bg-orange-500 text-black text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
        -{Math.round(product.discountPercentage)}% OFF
      </span>
    {/if}

    <!-- High Rating Bestseller Badge -->
    {#if product.rating >= 4.5}
      <span class="absolute top-3 right-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1">
        <Star class="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
        BESTSELLER
      </span>
    {/if}
  </div>

  <!-- Details -->
  <div class="flex-1 flex flex-col min-h-0">
    <!-- Category -->
    <p class="text-[9px] text-slate-500 uppercase tracking-widest font-mono truncate mb-1">
      {product.category} / {product.brand || 'Premium'}
    </p>

    <!-- Title -->
    <h4 class="text-sm md:text-base font-semibold text-white tracking-tight group-hover:text-orange-500 transition-colors line-clamp-1 mb-2">
      {product.title}
    </h4>

    <!-- Rating -->
    <div class="flex items-center gap-1 mb-3">
      <Star class="w-3 h-3 text-yellow-500 fill-yellow-500" />
      <span class="text-xs font-semibold text-slate-300">{product.rating}</span>
      <span class="text-[10px] text-slate-500 font-normal">/ 5.0</span>
    </div>

    <!-- Pricing and Actions -->
    <div class="mt-auto pt-2 flex items-center justify-between gap-4">
      <div class="flex flex-col">
        {#if originalPrice}
          <span class="text-[10px] font-mono text-slate-500 line-through">${originalPrice}</span>
        {/if}
        <span class="text-base md:text-lg font-mono font-bold text-orange-400">
          ${discountedPrice}
        </span>
      </div>

      <div class="flex gap-2">
        <!-- Wishlist Icon -->
        <button 
          onclick={handleToggleWishlist}
          class="w-10 h-10 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/5 hover:border-white/20 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Add to Wishlist"
        >
          <Heart class="w-4.5 h-4.5 {isWishlisted ? 'fill-red-500 text-red-500' : ''}" />
        </button>

        <!-- Cart Icon Button -->
        <button 
          onclick={handleAddToCart}
          class="w-10 h-10 bg-white text-black hover:bg-orange-500 hover:text-black hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer"
          title="Add to Cart"
        >
          <ShoppingCart class="w-4.5 h-4.5 font-bold" />
        </button>
      </div>
    </div>
  </div>
</div>
