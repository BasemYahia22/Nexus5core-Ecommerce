<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { fetchProductById } from '../services/api';
  import type { Product } from '../types';
  import { 
    ChevronLeft, 
    Heart, 
    ShoppingBag, 
    Star, 
    ShieldCheck, 
    Truck, 
    RotateCcw,
    Sparkles
  } from 'lucide-svelte';

  let product = $state<Product | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Gallery main image
  let activeImage = $state('');
  let quantity = $state(1);

  // Derived
  let isWishlisted = $derived(product ? store.wishlist.includes(product.id) : false);
  let discountedPrice = $derived(product ? product.price : 0);
  let originalPrice = $derived(
    product && product.discountPercentage 
      ? Math.round(product.price / (1 - (product.discountPercentage / 100))) 
      : null
  );

  $effect(() => {
    if (store.selectedProductId) {
      loadProduct();
    }
  });

  async function loadProduct() {
    if (!store.selectedProductId) return;
    loading = true;
    error = null;
    try {
      const p = await fetchProductById(store.selectedProductId);
      if (p) {
        product = p;
        activeImage = p.images[0] || p.thumbnail;
        quantity = 1; // Reset quantity on loading new product
      } else {
        error = 'Product not found';
      }
    } catch (err) {
      console.error(err);
      error = 'Failed to load product details';
    } finally {
      loading = false;
    }
  }

  function handleBack() {
    store.currentView = 'shop';
  }

  function handleAddToCart() {
    if (!product) return;
    store.addToCart(product, quantity);
  }

  function handleToggleWishlist() {
    if (!product) return;
    store.toggleWishlist(product);
  }

  function changeImage(img: string) {
    activeImage = img;
  }
</script>

<div class="p-6 md:p-8 flex-1 overflow-y-auto">
  <!-- Back Button -->
  <button 
    onclick={handleBack}
    class="flex items-center gap-2 text-slate-400 hover:text-white mb-8 group cursor-pointer text-xs font-mono uppercase tracking-widest"
  >
    <ChevronLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
    Back to Catalog
  </button>

  {#if loading}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
      <!-- Left side -->
      <div class="space-y-4">
        <div class="h-96 bg-white/5 rounded-3xl w-full"></div>
        <div class="flex gap-3">
          <div class="w-20 h-20 bg-white/5 rounded-xl"></div>
          <div class="w-20 h-20 bg-white/5 rounded-xl"></div>
          <div class="w-20 h-20 bg-white/5 rounded-xl"></div>
        </div>
      </div>
      <!-- Right side -->
      <div class="space-y-5">
        <div class="h-4 bg-white/5 rounded-full w-1/4"></div>
        <div class="h-10 bg-white/5 rounded-full w-3/4"></div>
        <div class="h-6 bg-white/5 rounded-full w-1/3"></div>
        <div class="h-24 bg-white/5 rounded-3xl w-full"></div>
        <div class="h-12 bg-white/5 rounded-2xl w-full"></div>
      </div>
    </div>
  {:else if error}
    <div class="text-center py-20">
      <p class="text-red-500 font-bold mb-4">{error}</p>
      <button onclick={handleBack} class="px-6 py-2.5 bg-orange-500 text-black font-bold rounded-xl">
        Return to Shop
      </button>
    </div>
  {:else if product}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
      
      <!-- Interactive Media Gallery -->
      <div class="space-y-4">
        <div class="h-[400px] md:h-[480px] bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center p-8 relative overflow-hidden">
          <!-- Light background effect -->
          <div class="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent"></div>
          <img 
            src={activeImage} 
            alt={product.title} 
            class="max-w-full max-h-full object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)] hover:scale-105 transition-transform duration-300"
          />
        </div>

        <!-- Thumbnails -->
        {#if product.images.length > 1}
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {#each product.images as img}
              <button 
                onclick={() => changeImage(img)}
                class="w-20 h-20 bg-white/5 border rounded-2xl p-2 flex items-center justify-center cursor-pointer shrink-0 transition-all hover:bg-white/10 {activeImage === img ? 'border-orange-500' : 'border-white/10'}"
              >
                <img src={img} alt="Thumbnail" class="max-w-full max-h-full object-contain" />
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Product Description & Custom controls -->
      <div class="flex flex-col gap-6">
        <div>
          <p class="text-xs text-orange-500 uppercase tracking-widest font-bold font-mono mb-2">
            {product.category} / {product.brand || 'Engine Core'}
          </p>
          <h2 class="text-2xl md:text-3xl font-light tracking-tight text-white mb-3">
            {product.title}
          </h2>

          <div class="flex items-center gap-4">
            <div class="flex items-center gap-1">
              <Star class="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span class="text-sm font-semibold text-slate-200">{product.rating}</span>
              <span class="text-xs text-slate-500">Rating</span>
            </div>
            <div class="w-1.5 h-1.5 bg-white/15 rounded-full"></div>
            <div class="text-xs" class:text-emerald-500={product.stock > 0} class:text-red-500={product.stock <= 0}>
              {#if product.stock > 0}
                In Stock ({product.stock} units available)
              {:else}
                Out of Stock
              {/if}
            </div>
          </div>
        </div>

        <!-- Price Panel -->
        <div class="bg-white/5 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Premium Price</span>
            <div class="flex items-baseline gap-3 mt-1">
              <span class="text-3xl font-bold font-mono text-orange-400">${discountedPrice}</span>
              {#if originalPrice}
                <span class="text-sm font-mono text-slate-500 line-through">${originalPrice}</span>
                <span class="text-xs font-bold text-orange-500">-{Math.round(product.discountPercentage)}%</span>
              {/if}
            </div>
          </div>

          <!-- Quantity Selector -->
          {#if product.stock > 0}
            <div class="flex flex-col">
              <span class="text-[10px] text-slate-500 uppercase tracking-widest font-mono mb-1">Batch Load</span>
              <div class="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-1 w-fit">
                <button 
                  onclick={() => { if (quantity > 1) quantity--; }}
                  class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/5 font-mono cursor-pointer"
                >
                  -
                </button>
                <span class="w-8 text-center font-mono text-sm text-white">{quantity}</span>
                <button 
                  onclick={() => { if (quantity < product.stock) quantity++; }}
                  class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-white/5 font-mono cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Description -->
        <div>
          <h4 class="text-xs uppercase tracking-widest text-slate-400 font-mono mb-2">Description</h4>
          <p class="text-slate-300 text-sm leading-relaxed font-light">
            {product.description}
          </p>
        </div>

        <!-- Tech Badges -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-white/5 py-6">
          <div class="flex items-center gap-3">
            <ShieldCheck class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-[11px] text-white font-semibold">Warranty</p>
              <p class="text-[10px] text-slate-500">{product.warrantyInformation || '1 Year Guaranteed'}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Truck class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-[11px] text-white font-semibold">Shipping</p>
              <p class="text-[10px] text-slate-500">{product.shippingInformation || 'Global Cargo'}</p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <RotateCcw class="w-5 h-5 text-orange-500" />
            <div>
              <p class="text-[11px] text-white font-semibold">Returns</p>
              <p class="text-[10px] text-slate-500">{product.returnPolicy || '30-day money back'}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button 
            onclick={handleAddToCart}
            disabled={product.stock <= 0}
            class="flex-1 bg-orange-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_6px_20px_rgba(249,115,22,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
          >
            <ShoppingBag class="w-4 h-4" />
            Add To Bag
          </button>
          
          <button 
            onclick={handleToggleWishlist}
            class="w-14 h-14 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all text-slate-300 hover:text-white cursor-pointer"
            title="Wishlist"
          >
            <Heart class="w-6 h-6 {isWishlisted ? 'fill-red-500 text-red-500' : ''}" />
          </button>
        </div>
      </div>
    </div>

    <!-- Reviews Block -->
    {#if product.reviews && product.reviews.length > 0}
      <div class="mt-16 border-t border-white/5 pt-10">
        <h3 class="text-xl font-light text-white mb-8">
          Product <span class="italic font-serif text-orange-500">Reviews</span>
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each product.reviews as review}
            <div class="bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div class="flex justify-between items-start mb-4">
                  <div>
                    <h5 class="text-sm font-semibold text-white">{review.reviewerName}</h5>
                    <p class="text-[10px] text-slate-500 font-mono">{review.reviewerEmail}</p>
                  </div>
                  <div class="flex gap-0.5">
                    {#each Array(5) as _, i}
                      <Star 
                        class="w-3.5 h-3.5 {i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700'}" 
                      />
                    {/each}
                  </div>
                </div>
                <p class="text-xs text-slate-300 leading-relaxed italic">"{review.comment}"</p>
              </div>
              <p class="text-[10px] text-slate-600 font-mono mt-6 text-right">
                {new Date(review.date).toLocaleDateString()}
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
