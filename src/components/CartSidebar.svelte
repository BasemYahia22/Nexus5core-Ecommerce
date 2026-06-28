<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { X, Trash2, Plus, Minus, ShoppingBag, ChevronRight } from 'lucide-svelte';
  import AuthModal from './auth/AuthModal.svelte';

  let authOpen = $state(false);

  function handleClose() {
    store.cartOpen = false;
  }

  function handleCheckout() {
    if (store.cart.length === 0) return;
    
    if (!store.user) {
      authOpen = true;
    } else {
      store.currentView = 'checkout';
      store.cartOpen = false;
    }
  }

  // Calculate remaining for free shipping
  let freeShippingThreshold = 150;
  let remainingForFree = $derived(Math.max(0, freeShippingThreshold - store.cartSubtotal));
  let percentToFree = $derived(Math.min(100, (store.cartSubtotal / freeShippingThreshold) * 100));
</script>

{#if store.cartOpen}
  <!-- Backdrop Blur overlay -->
  <div 
    class="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex justify-end"
    onclick={handleClose}
    role="button"
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Escape') handleClose(); }}
  >
    <!-- Drawer panel (Click shouldn't bubble to backdrop) -->
    <div 
      class="w-full max-w-md bg-[#090909] border-l border-white/10 h-full flex flex-col p-6 md:p-8 relative shadow-[-10px_0_30px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-300 pointer-events-auto"
      onclick={(e) => e.stopPropagation()}
      role="dialog"
    >
      <!-- Header -->
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/5 shrink-0">
        <div class="flex items-center gap-2.5">
          <ShoppingBag class="w-5 h-5 text-orange-500" />
          <h3 class="text-lg font-bold tracking-tight text-white">Your Bag</h3>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{store.cartTotalItems} items</span>
          <button 
            onclick={handleClose}
            class="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- Free Shipping Tracker -->
      {#if store.cart.length > 0}
        <div class="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6 shrink-0">
          {#if remainingForFree > 0}
            <p class="text-xs text-slate-300 font-light">
              Add <span class="font-bold text-orange-400">${remainingForFree}</span> more to unlock <span class="text-emerald-400 font-semibold">FREE SHIPPING</span>
            </p>
            <div class="relative w-full h-1 bg-white/10 rounded-full mt-2.5 overflow-hidden">
              <div 
                class="absolute left-0 top-0 h-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] transition-all duration-300"
                style="width: {percentToFree}%"
              ></div>
            </div>
          {:else}
            <p class="text-xs text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
              🎉 Congratulations! You have unlocked FREE shipping.
            </p>
          {/if}
        </div>
      {/if}

      <!-- Scrollable Cart Items List -->
      <div class="flex-1 overflow-y-auto space-y-5 pr-1 py-1 scrollbar-thin">
        {#if store.cart.length === 0}
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag class="w-12 h-12 text-slate-600 mb-4" />
            <p class="text-slate-400 font-semibold mb-2">Your bag is empty</p>
            <p class="text-xs text-slate-600 uppercase tracking-widest max-w-xs leading-relaxed mb-6">
              Load premium hardware cores from Nexus Core.
            </p>
            <button 
              onclick={() => { store.currentView = 'shop'; handleClose(); }}
              class="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-black transition-colors"
            >
              Start shopping
            </button>
          </div>
        {:else}
          {#each store.cart as item (item.product.id)}
            <div class="flex gap-4 items-center p-3 bg-white/5 rounded-2xl border border-white/5 relative group hover:border-white/10 transition-colors">
              <!-- Thumb -->
              <div class="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center shrink-0 p-2 border border-white/5">
                <img src={item.product.thumbnail} alt={item.product.title} class="max-w-full max-h-full object-contain" />
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <h5 class="text-sm font-semibold text-white truncate hover:text-orange-500 transition-colors">
                    {item.product.title}
                  </h5>
                  <button 
                    onclick={() => store.removeFromCart(item.product.id)}
                    class="text-slate-500 hover:text-red-400 p-0.5 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-[10px] text-slate-500 font-mono uppercase truncate mt-0.5">{item.product.category}</p>

                <div class="flex items-center justify-between mt-3">
                  <!-- Quantities control -->
                  <div class="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-lg p-0.5">
                    <button 
                      onclick={() => store.updateCartQuantity(item.product.id, item.quantity - 1)}
                      class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-white/5 text-xs font-mono cursor-pointer"
                    >
                      <Minus class="w-3 h-3" />
                    </button>
                    <span class="w-6 text-center font-mono text-xs text-white">{item.quantity}</span>
                    <button 
                      onclick={() => store.updateCartQuantity(item.product.id, item.quantity + 1)}
                      class="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-white/5 text-xs font-mono cursor-pointer"
                    >
                      <Plus class="w-3 h-3" />
                    </button>
                  </div>

                  <!-- Price sum -->
                  <span class="text-sm font-mono text-orange-400 font-bold">
                    ${item.product.price * item.quantity}
                  </span>
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Footer Checkout Summary -->
      {#if store.cart.length > 0}
        <div class="mt-auto border-t border-white/10 pt-6 shrink-0 bg-[#090909]">
          <div class="space-y-2.5 mb-6">
            <div class="flex justify-between text-xs text-slate-500 uppercase tracking-wider font-mono">
              <span>Subtotal</span>
              <span class="font-mono text-white">${store.cartSubtotal}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 uppercase tracking-wider font-mono">
              <span>Cargo Shipping</span>
              {#if store.shippingCost === 0}
                <span class="text-emerald-400 font-black tracking-tighter uppercase">FREE</span>
              {:else}
                <span class="font-mono text-white">${store.shippingCost}</span>
              {/if}
            </div>
            <div class="border-t border-white/5 my-2 pt-2.5 flex justify-between text-base font-bold text-white">
              <span>Total Bill</span>
              <span class="font-mono text-lg text-orange-500 font-black">
                ${store.cartTotal}
              </span>
            </div>
          </div>

          <button 
            onclick={handleCheckout}
            class="w-full bg-orange-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_8px_25px_rgba(249,115,22,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Secure Checkout</span>
            <ChevronRight class="w-4 h-4" />
          </button>
          
          <p class="text-[9px] text-center text-slate-600 mt-4 uppercase tracking-[0.15em] font-mono">
            Powered by Firebase auth & firestore
          </p>
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Auth Modal in case user checks out without login -->
<AuthModal bind:isOpen={authOpen} />
