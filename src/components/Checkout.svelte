<script lang="ts">
  import { store } from '../lib/store.svelte';
  import { saveOrderToFirestore, updateUserProfile } from '../services/firebase';
  import type { Address, Order } from '../types';
  import { ShieldCheck, Truck, CreditCard, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-svelte';

  let loading = $state(false);
  let orderPlacedId = $state<string | null>(null);

  // Address form states
  let name = $state('');
  let email = $state('');
  let phone = $state('');
  let street = $state('');
  let city = $state('');
  let state = $state('');
  let country = $state('');
  let zipCode = $state('');
  let saveAddress = $state(true);

  // Auto populate address if user has addresses
  $effect(() => {
    if (store.user && store.user.addresses && store.user.addresses.length > 0) {
      const defaultAddress = store.user.addresses.find(a => a.isDefault) || store.user.addresses[0];
      name = defaultAddress.name || store.user.displayName || '';
      phone = defaultAddress.phone || '';
      street = defaultAddress.street || '';
      city = defaultAddress.city || '';
      state = defaultAddress.state || '';
      country = defaultAddress.country || '';
      zipCode = defaultAddress.zipCode || '';
    } else if (store.user) {
      name = store.user.displayName || '';
    }
  });

  async function handlePlaceOrder(e: Event) {
    e.preventDefault();
    if (store.cart.length === 0) {
      store.addToast('Your cart is empty', 'warning');
      return;
    }

    if (!name || !phone || !street || !city || !state || !country || !zipCode) {
      store.addToast('Please fill all shipping details', 'warning');
      return;
    }

    if (!store.user && !email) {
      store.addToast('Please provide your email address', 'warning');
      return;
    }

    loading = true;

    try {
      const shippingAddress: Address = {
        id: Math.random().toString(36).slice(2, 9),
        name,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: store.user?.addresses?.length === 0 // Default if it's their first address
      };

      // Save address if user checked "Save to profile" and it doesn't already exist
      if (store.user && saveAddress) {
        const addressExists = store.user.addresses?.some(
          a => a.street === street && a.city === city
        );
        if (!addressExists) {
          const updatedAddresses = [...(store.user.addresses || []), shippingAddress];
          await updateUserProfile(store.user.uid, { addresses: updatedAddresses });
          store.user.addresses = updatedAddresses; // local state update
        }
      }

      // Format order items for Firestore
      const orderItems = store.cart.map(item => ({
        productId: item.product.id,
        title: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        thumbnail: item.product.thumbnail
      }));

      // Create Order payload compatible with firestore schema
      const orderData: Omit<Order, 'id'> = {
        userId: store.user?.uid || ('guest_' + Math.random().toString(36).slice(2, 9)),
        email: store.user?.email || email || 'guest@example.com',
        items: orderItems,
        shippingAddress,
        subtotal: store.cartSubtotal,
        shippingFee: store.shippingCost,
        discount: 0,
        total: store.cartTotal,
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentMethod: 'Credit Card / Online Gate'
      };

      const orderId = await saveOrderToFirestore(orderData);
      orderPlacedId = orderId;
      store.addToast('Order placed successfully!', 'success');
      
      // Clear cart
      await store.clearCart();
    } catch (err: any) {
      console.error(err);
      store.addToast('Failed to place order: ' + err.message, 'error');
    } finally {
      loading = false;
    }
  }

  function handleBackToShop() {
    store.currentView = 'shop';
  }

  function handleGoToDashboard() {
    store.currentView = 'dashboard';
    orderPlacedId = null; // Reset success page
  }
</script>

<div class="p-6 md:p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full">
  <!-- Back Button -->
  <button 
    onclick={handleBackToShop}
    class="flex items-center gap-2 text-slate-400 hover:text-white mb-8 group cursor-pointer text-xs font-mono uppercase tracking-widest"
  >
    <ChevronLeft class="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
    Cancel and Shop
  </button>

  {#if orderPlacedId}
    <!-- SUCCESS PAGE -->
    <div class="flex flex-col items-center justify-center text-center py-12 max-w-md mx-auto">
      <div class="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 class="w-10 h-10 text-emerald-500" />
      </div>

      <h2 class="text-3xl font-light tracking-tight text-white">Order <span class="italic font-serif text-emerald-400">Confirmed</span></h2>
      <p class="text-xs text-slate-500 uppercase tracking-widest mt-1 font-mono">Invoice ID: #{orderPlacedId}</p>

      <div class="bg-white/5 border border-white/5 rounded-3xl p-6 w-full my-8 text-left space-y-4">
        <p class="text-sm text-slate-300 font-light leading-relaxed">
          Your payment was processed successfully. The engine core is prepping your cargo for express transit.
        </p>
        <div class="border-t border-white/5 pt-4 flex justify-between text-xs font-mono">
          <span class="text-slate-500">SHIPPED TO</span>
          <span class="text-white text-right">{name}<br>{street}, {city}</span>
        </div>
      </div>

      <div class="flex gap-4 w-full">
        <button 
          onclick={handleBackToShop}
          class="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
        >
          Keep Shopping
        </button>
        {#if store.user}
          <button 
            onclick={handleGoToDashboard}
            class="flex-1 bg-orange-500 text-black py-3 text-xs font-bold uppercase tracking-widest rounded-xl hover:shadow-[0_4px_15px_rgba(249,115,22,0.4)] transition-all cursor-pointer"
          >
            View Order History
          </button>
        {/if}
      </div>
    </div>
  {:else}
    <!-- CHECKOUT FORM -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
      
      <!-- SHIPPING FORM -->
      <form onsubmit={handlePlaceOrder} class="lg:col-span-7 space-y-6">
        <div>
          <h2 class="text-2xl font-light tracking-tight text-white">Cargo <span class="italic font-serif text-orange-500">Shipping</span></h2>
          <p class="text-xs text-slate-500 uppercase tracking-widest mt-1">Specify destination coordinates</p>
        </div>

        {#if !store.user}
          <div class="space-y-2">
            <label for="c-email" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Email Address (For guest tracking)</label>
            <input 
              id="c-email"
              type="email" 
              placeholder="name@example.com" 
              bind:value={email}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
        {/if}

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label for="c-name" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Recipient Name</label>
            <input 
              id="c-name"
              type="text" 
              placeholder="Full Name" 
              bind:value={name}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
          <div class="space-y-2">
            <label for="c-phone" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Phone Contact</label>
            <input 
              id="c-phone"
              type="text" 
              placeholder="+1 (555) 000-0000" 
              bind:value={phone}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="c-street" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Street Address</label>
          <input 
            id="c-street"
            type="text" 
            placeholder="123 Cyber Way, Apt 4" 
            bind:value={street}
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
            required
          />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="space-y-2 col-span-2 md:col-span-2">
            <label for="c-city" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">City</label>
            <input 
              id="c-city"
              type="text" 
              placeholder="San Francisco" 
              bind:value={city}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
          <div class="space-y-2">
            <label for="c-state" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">State</label>
            <input 
              id="c-state"
              type="text" 
              placeholder="CA" 
              bind:value={state}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
          <div class="space-y-2">
            <label for="c-zip" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Zip Code</label>
            <input 
              id="c-zip"
              type="text" 
              placeholder="94103" 
              bind:value={zipCode}
              class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
              required
            />
          </div>
        </div>

        <div class="space-y-2">
          <label for="c-country" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Country</label>
          <input 
            id="c-country"
            type="text" 
            placeholder="United States" 
            bind:value={country}
            class="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
            required
          />
        </div>

        <!-- Saved profile address checkbox -->
        {#if store.user}
          <label class="flex items-center gap-3 cursor-pointer group mt-4 w-fit select-none">
            <input 
              type="checkbox" 
              bind:checked={saveAddress} 
              class="hidden" 
            />
            <div 
              class="w-5 h-5 border rounded-lg flex items-center justify-center transition-all {saveAddress ? 'border-orange-500 bg-orange-500' : 'border-white/10'}"
            >
              {#if saveAddress}
                <svg class="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M5 13l4 4L19 7"/>
                </svg>
              {/if}
            </div>
            <span class="text-xs text-slate-400 group-hover:text-white transition-colors">Save address to profile</span>
          </label>
        {/if}

        <!-- SECURE PORT CORES -->
        <div class="border-t border-white/5 pt-6 space-y-4">
          <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
            <CreditCard class="w-4 h-4 text-orange-500" />
            Core Gateway Method
          </h3>
          <div class="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <p class="text-xs font-bold text-white uppercase tracking-wider">Premium Card / Online Portal</p>
              <p class="text-[10px] text-slate-500 mt-1 font-mono">Auto-encrypted via stripe-compatible sandbox</p>
            </div>
            <div class="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
              <div class="w-2 h-2 bg-black rounded-full"></div>
            </div>
          </div>
        </div>
      </form>

      <!-- ORDER BILL SUMMARY -->
      <div class="lg:col-span-5 flex flex-col gap-6">
        <div class="bg-[#0b0b0b] border border-white/10 rounded-3xl p-6 flex flex-col relative overflow-hidden">
          <h3 class="text-lg font-bold text-white mb-6">Order Summary</h3>

          <!-- Items list -->
          <div class="space-y-4 max-h-[300px] overflow-y-auto mb-6 pr-2 scrollbar-thin">
            {#each store.cart as item}
              <div class="flex gap-3 items-center">
                <div class="w-12 h-12 bg-white/5 border border-white/5 rounded-xl shrink-0 p-1.5 flex items-center justify-center">
                  <img src={item.product.thumbnail} alt={item.product.title} class="max-w-full max-h-full object-contain" />
                </div>
                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-semibold text-white truncate">{item.product.title}</h4>
                  <p class="text-[10px] text-slate-500 font-mono mt-0.5">QTY: {item.quantity}</p>
                </div>
                <span class="text-xs font-mono font-bold text-orange-400 shrink-0">
                  ${item.product.price * item.quantity}
                </span>
              </div>
            {/each}
          </div>

          <!-- Totals -->
          <div class="border-t border-white/5 pt-5 space-y-3 shrink-0">
            <div class="flex justify-between text-xs text-slate-500 uppercase tracking-widest font-mono">
              <span>Subtotal</span>
              <span class="text-white">${store.cartSubtotal}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500 uppercase tracking-widest font-mono">
              <span>Delivery Cost</span>
              {#if store.shippingCost === 0}
                <span class="text-emerald-400 font-bold">FREE</span>
              {:else}
                <span class="text-white">${store.shippingCost}</span>
              {/if}
            </div>
            <div class="border-t border-white/5 pt-3 flex justify-between text-base font-bold text-white">
              <span>Total Bill</span>
              <span class="font-mono text-orange-500">${store.cartTotal}</span>
            </div>
          </div>

          <!-- Checkout call action -->
          <button 
            type="submit"
            disabled={loading || store.cart.length === 0}
            onclick={handlePlaceOrder}
            class="w-full bg-orange-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_8px_25px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer disabled:opacity-50"
          >
            {#if loading}
              <span>Validating Transit...</span>
            {:else}
              <ShieldCheck class="w-4 h-4" />
              <span>Confirm & Place Order</span>
            {/if}
          </button>
        </div>

        <!-- Trust panel -->
        <div class="p-5 border border-white/5 bg-white/5 rounded-2xl flex items-center gap-4">
          <Truck class="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <p class="text-xs font-bold text-white uppercase tracking-wider">Instant Cargo Tracking</p>
            <p class="text-[10px] text-slate-500 mt-1 leading-relaxed">
              Your shipping is logged onto Firestore for security. Follow delivery updates straight from your user dashboard.
            </p>
          </div>
        </div>
      </div>

    </div>
  {/if}
</div>
