<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { getUserOrders, updateUserProfile } from '../services/firebase';
  import type { Order, Address } from '../types';
  import { 
    User, 
    ShoppingBag, 
    MapPin, 
    Calendar, 
    CheckCircle, 
    Clock, 
    Truck, 
    XCircle,
    Plus,
    Trash2
  } from 'lucide-svelte';

  let orders = $state<Order[]>([]);
  let loadingOrders = $state(true);

  // Add address states
  let showAddAddress = $state(false);
  let addrName = $state('');
  let addrPhone = $state('');
  let addrStreet = $state('');
  let addrCity = $state('');
  let addrState = $state('');
  let addrZip = $state('');
  let addrCountry = $state('');

  onMount(async () => {
    if (store.user) {
      await fetchOrders();
    }
  });

  async function fetchOrders() {
    if (!store.user) return;
    loadingOrders = true;
    try {
      const fetched = await getUserOrders(store.user.uid);
      orders = fetched;
    } catch (err) {
      console.error(err);
      store.addToast('Failed to load orders', 'error');
    } finally {
      loadingOrders = false;
    }
  }

  async function handleAddAddress(e: Event) {
    e.preventDefault();
    if (!store.user) return;

    if (!addrName || !addrPhone || !addrStreet || !addrCity || !addrState || !addrZip || !addrCountry) {
      store.addToast('Please fill all address fields', 'warning');
      return;
    }

    try {
      const newAddress: Address = {
        id: Math.random().toString(36).slice(2, 9),
        name: addrName,
        phone: addrPhone,
        street: addrStreet,
        city: addrCity,
        state: addrState,
        zipCode: addrZip,
        country: addrCountry,
        isDefault: store.user.addresses?.length === 0
      };

      const updatedAddresses = [...(store.user.addresses || []), newAddress];
      await updateUserProfile(store.user.uid, { addresses: updatedAddresses });
      
      // Update local state
      store.user.addresses = updatedAddresses;
      
      store.addToast('Address added successfully!', 'success');
      
      // Reset form
      showAddAddress = false;
      addrName = '';
      addrPhone = '';
      addrStreet = '';
      addrCity = '';
      addrState = '';
      addrZip = '';
      addrCountry = '';
    } catch (err) {
      console.error(err);
      store.addToast('Failed to add address', 'error');
    }
  }

  async function handleDeleteAddress(addressId: string) {
    if (!store.user) return;

    try {
      const updatedAddresses = store.user.addresses.filter(a => a.id !== addressId);
      await updateUserProfile(store.user.uid, { addresses: updatedAddresses });
      store.user.addresses = updatedAddresses;
      store.addToast('Address deleted', 'info');
    } catch (err) {
      console.error(err);
      store.addToast('Failed to delete address', 'error');
    }
  }
</script>

<div class="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-6xl mx-auto">
  <div class="mb-8">
    <h2 class="text-3xl font-light tracking-tight text-white">Your <span class="italic font-serif text-orange-500">Dashboard</span></h2>
    <p class="text-xs text-slate-500 uppercase tracking-widest mt-1 font-mono">Personal console and cargo log</p>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
    
    <!-- LEFT SIDE: PROFILE & ADDRESSES -->
    <div class="lg:col-span-4 space-y-8">
      <!-- Profile Details -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
        <div class="absolute -top-12 -right-12 w-24 h-24 bg-orange-500/5 blur-2xl rounded-full"></div>
        
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-full border-2 border-orange-500/30 overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center">
            {#if store.user?.photoURL}
              <img src={store.user.photoURL} alt={store.user.displayName} class="w-full h-full object-cover" />
            {:else}
              <span class="text-orange-500 font-bold italic uppercase text-lg">
                {store.user?.displayName ? store.user.displayName.slice(0, 2) : 'US'}
              </span>
            {/if}
          </div>
          <div>
            <h3 class="text-base font-bold text-white truncate">{store.user?.displayName}</h3>
            <p class="text-xs text-slate-500 truncate mt-0.5">{store.user?.email}</p>
          </div>
        </div>

        <div class="space-y-3 pt-4 border-t border-white/5 text-xs font-mono">
          <div class="flex justify-between">
            <span class="text-slate-500">ACCOUNT TYPE</span>
            <span class="text-orange-400 font-bold uppercase">{store.user?.role}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">UID REFERENCE</span>
            <span class="text-slate-300 select-all truncate max-w-[120px]">{store.user?.uid}</span>
          </div>
        </div>
      </div>

      <!-- Saved Addresses -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
        <div class="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
          <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2">
            <MapPin class="w-4 h-4 text-orange-500" />
            Addresses ({store.user?.addresses?.length || 0})
          </h3>
          <button 
            onclick={() => showAddAddress = !showAddAddress}
            class="text-xs text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 cursor-pointer"
          >
            {#if showAddAddress}✕ Cancel{:else}<Plus class="w-4 h-4" /> Add{/if}
          </button>
        </div>

        {#if showAddAddress}
          <!-- Add Address Form -->
          <form onsubmit={handleAddAddress} class="space-y-4 mb-6">
            <div class="space-y-1">
              <label for="addr-name" class="text-[9px] uppercase font-mono text-slate-500">Contact Name</label>
              <input 
                id="addr-name"
                type="text" 
                placeholder="Full Name" 
                bind:value={addrName}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                required
              />
            </div>
            <div class="space-y-1">
              <label for="addr-phone" class="text-[9px] uppercase font-mono text-slate-500">Phone</label>
              <input 
                id="addr-phone"
                type="text" 
                placeholder="+1 (555) 000-0000" 
                bind:value={addrPhone}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                required
              />
            </div>
            <div class="space-y-1">
              <label for="addr-street" class="text-[9px] uppercase font-mono text-slate-500">Street</label>
              <input 
                id="addr-street"
                type="text" 
                placeholder="123 Cyber Way" 
                bind:value={addrStreet}
                class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                required
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="addr-city" class="text-[9px] uppercase font-mono text-slate-500">City</label>
                <input 
                  id="addr-city"
                  type="text" 
                  placeholder="San Francisco" 
                  bind:value={addrCity}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  required
                />
              </div>
              <div class="space-y-1">
                <label for="addr-state" class="text-[9px] uppercase font-mono text-slate-500">State/Zip</label>
                <input 
                  id="addr-state"
                  type="text" 
                  placeholder="CA, 94103" 
                  bind:value={addrState}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  required
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label for="addr-zip" class="text-[9px] uppercase font-mono text-slate-500">Zip Code</label>
                <input 
                  id="addr-zip"
                  type="text" 
                  placeholder="94103" 
                  bind:value={addrZip}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  required
                />
              </div>
              <div class="space-y-1">
                <label for="addr-country" class="text-[9px] uppercase font-mono text-slate-500">Country</label>
                <input 
                  id="addr-country"
                  type="text" 
                  placeholder="United States" 
                  bind:value={addrCountry}
                  class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              class="w-full bg-orange-500 text-black font-bold text-xs uppercase tracking-widest py-2.5 rounded-xl hover:bg-orange-400 transition-colors cursor-pointer"
            >
              Save Address
            </button>
          </form>
        {/if}

        <div class="space-y-4">
          {#if !store.user?.addresses || store.user.addresses.length === 0}
            <p class="text-xs text-slate-600 uppercase tracking-widest font-mono text-center py-6">
              No saved addresses.
            </p>
          {:else}
            {#each store.user.addresses as address}
              <div class="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-start group">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <p class="text-xs font-bold text-white">{address.name}</p>
                    {#if address.isDefault}
                      <span class="text-[8px] bg-orange-500/10 text-orange-500 border border-orange-500/30 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Default</span>
                    {/if}
                  </div>
                  <p class="text-xs text-slate-300 mt-2 font-light leading-relaxed">{address.street}, {address.city}, {address.state}</p>
                  <p class="text-[10px] text-slate-500 font-mono mt-1">{address.country} // {address.phone}</p>
                </div>
                <button 
                  onclick={() => handleDeleteAddress(address.id)}
                  class="text-slate-500 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Delete address"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </div>

    <!-- RIGHT SIDE: ORDER HISTORY -->
    <div class="lg:col-span-8 space-y-8">
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
        <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono flex items-center gap-2 mb-6 pb-2 border-b border-white/5">
          <ShoppingBag class="w-4 h-4 text-orange-500" />
          Cargo Order History ({orders.length})
        </h3>

        {#if loadingOrders}
          <div class="space-y-4 animate-pulse">
            <div class="h-28 bg-white/5 rounded-2xl w-full"></div>
            <div class="h-28 bg-white/5 rounded-2xl w-full"></div>
            <div class="h-28 bg-white/5 rounded-2xl w-full"></div>
          </div>
        {:else if orders.length === 0}
          <div class="text-center py-20 text-slate-500">
            <ShoppingBag class="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p class="font-semibold text-sm mb-1">No orders placed yet</p>
            <p class="text-xs text-slate-600 uppercase tracking-widest leading-relaxed">Your order invoices will display here in real time.</p>
          </div>
        {:else}
          <div class="space-y-6">
            {#each orders as order (order.id)}
              <div class="bg-white/5 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                <!-- Top Row -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/5 pb-4 mb-4">
                  <div>
                    <p class="text-[10px] font-mono text-slate-500 uppercase">Order ID</p>
                    <p class="text-sm font-bold text-white uppercase mt-0.5">#{order.id}</p>
                  </div>
                  <div>
                    <p class="text-[10px] font-mono text-slate-500 uppercase">Transit Initiated</p>
                    <p class="text-xs text-slate-300 font-mono flex items-center gap-1.5 mt-0.5">
                      <Calendar class="w-3.5 h-3.5 text-slate-500" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p class="text-[10px] font-mono text-slate-500 uppercase">Status</p>
                    <div class="flex items-center gap-1.5 mt-1">
                      {#if order.status === 'pending'}
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-500/10 text-orange-500 border border-orange-500/30 flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          Pending
                        </span>
                      {:else if order.status === 'processing'}
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 flex items-center gap-1">
                          <Clock class="w-3 h-3" />
                          Processing
                        </span>
                      {:else if order.status === 'shipped'}
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500/10 text-sky-500 border border-sky-500/30 flex items-center gap-1">
                          <Truck class="w-3 h-3" />
                          Shipped
                        </span>
                      {:else if order.status === 'delivered'}
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle class="w-3 h-3" />
                          Delivered
                        </span>
                      {:else}
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/30 flex items-center gap-1">
                          <XCircle class="w-3 h-3" />
                          Cancelled
                        </span>
                      {/if}
                    </div>
                  </div>
                  <div>
                    <p class="text-[10px] font-mono text-slate-500 uppercase">Bill Amount</p>
                    <p class="text-sm font-mono font-bold text-orange-400 mt-0.5">${order.total}</p>
                  </div>
                </div>

                <!-- Products in this order -->
                <div class="space-y-3">
                  {#each order.items as item}
                    <div class="flex justify-between items-center text-xs">
                      <div class="flex items-center gap-3 min-w-0">
                        <div class="w-10 h-10 bg-white/5 border border-white/5 rounded-lg shrink-0 p-1 flex items-center justify-center">
                          <img src={item.thumbnail} alt={item.title} class="max-w-full max-h-full object-contain" />
                        </div>
                        <span class="text-slate-300 font-semibold truncate max-w-sm">{item.title}</span>
                      </div>
                      <div class="flex items-center gap-6 font-mono text-slate-500 shrink-0">
                        <span>QTY: {item.quantity}</span>
                        <span class="text-white">${item.price * item.quantity}</span>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Shipping Address details -->
                <div class="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between text-[11px] text-slate-500 font-mono gap-2">
                  <span>TRANSIT DESTINATION: {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state}</span>
                  <span class="text-slate-600">METHOD: CREDIT CARD / SECURE ONLINE GATE</span>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

  </div>
</div>
