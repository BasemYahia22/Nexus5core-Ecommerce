<script lang="ts">
  import { onMount } from 'svelte';
  import { store } from '../lib/store.svelte';
  import { getAllOrders, getAllUsers, updateOrderStatus } from '../services/firebase';
  import type { Order, UserProfile } from '../types';
  import { 
    DollarSign, 
    ShoppingBag, 
    Users, 
    Box, 
    RefreshCw, 
    Check, 
    Calendar,
    ChevronDown,
    ShieldAlert
  } from 'lucide-svelte';

  let orders = $state<Order[]>([]);
  let users = $state<UserProfile[]>([]);
  let loading = $state(true);

  // Stats
  let totalSales = $derived(
    orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0)
  );
  let totalOrdersCount = $derived(orders.length);
  let totalUsersCount = $derived(users.length);

  onMount(async () => {
    await loadAdminData();
  });

  async function loadAdminData() {
    loading = true;
    try {
      const fetchedOrders = await getAllOrders();
      orders = fetchedOrders;

      const fetchedUsers = await getAllUsers();
      users = fetchedUsers;
    } catch (err) {
      console.error(err);
      store.addToast('Failed to load admin logs', 'error');
    } finally {
      loading = false;
    }
  }

  async function handleStatusChange(orderId: string, newStatus: Order['status']) {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Update local state
      orders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      
      store.addToast(`Order #${orderId} set to ${newStatus}`, 'success');
    } catch (err) {
      console.error(err);
      store.addToast('Failed to modify order status', 'error');
    }
  }

  // Draw smooth SVG charts based on orders data
  let chartPoints = $derived.by(() => {
    if (orders.length === 0) return '0,100 100,100';
    // Group orders by last 6 days or simply take 6 consecutive orders to map
    const sorted = [...orders].reverse().slice(-6);
    const maxVal = Math.max(...sorted.map(o => o.total), 100);
    return sorted.map((o, idx) => {
      const x = (idx / 5) * 100; // percent width
      const y = 100 - ((o.total / maxVal) * 80); // percent height (inverted, keeping 20% safety margin)
      return { x, y, total: o.total, id: o.id };
    });
  });

  let polylineString = $derived(chartPoints.map(p => `${p.x},${p.y}`).join(' '));
</script>

<div class="p-6 md:p-8 flex-1 overflow-y-auto w-full max-w-6xl mx-auto">
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
    <div>
      <h2 class="text-3xl font-light tracking-tight text-white flex items-center gap-3">
        <span class="italic font-serif text-orange-500">Admin</span> Control Panel
      </h2>
      <p class="text-xs text-slate-500 uppercase tracking-widest mt-1 font-mono">Store analytics and logistics registry</p>
    </div>
    
    <button 
      onclick={loadAdminData}
      disabled={loading}
      class="bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 h-fit"
    >
      <RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
      Sync Registry
    </button>
  </div>

  {#if loading}
    <div class="space-y-8 animate-pulse">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="h-28 bg-white/5 rounded-3xl w-full"></div>
        <div class="h-28 bg-white/5 rounded-3xl w-full"></div>
        <div class="h-28 bg-white/5 rounded-3xl w-full"></div>
        <div class="h-28 bg-white/5 rounded-3xl w-full"></div>
      </div>
      <div class="h-64 bg-white/5 rounded-3xl w-full"></div>
      <div class="h-96 bg-white/5 rounded-3xl w-full"></div>
    </div>
  {:else}
    <!-- STATS CARDS -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <!-- Total Sales -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center gap-5">
        <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
          <DollarSign class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Gross Sales</p>
          <h3 class="text-2xl font-bold font-mono text-white mt-1">${totalSales.toLocaleString()}</h3>
        </div>
        <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-500/5 blur-xl rounded-full"></div>
      </div>

      <!-- Total Orders -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center gap-5">
        <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
          <ShoppingBag class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Gross Cargo Orders</p>
          <h3 class="text-2xl font-bold font-mono text-white mt-1">{totalOrdersCount}</h3>
        </div>
        <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-500/5 blur-xl rounded-full"></div>
      </div>

      <!-- Total Users -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex items-center gap-5">
        <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Registered Users</p>
          <h3 class="text-2xl font-bold font-mono text-white mt-1">{totalUsersCount}</h3>
        </div>
        <div class="absolute -right-6 -bottom-6 w-16 h-16 bg-orange-500/5 blur-xl rounded-full"></div>
      </div>
    </div>

    <!-- ANALYTICS SVG LINE CHART -->
    <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 mb-8">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono">Sales Velocity Analytics</h3>
        <span class="text-[9px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-2 py-0.5 rounded uppercase font-black tracking-wider">Dynamic Stream</span>
      </div>

      <!-- Chart visualizer -->
      <div class="h-48 w-full relative">
        <svg viewBox="0 0 100 100" class="w-full h-full overflow-visible" preserveAspectRatio="none">
          <!-- Background grids -->
          <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" stroke-width="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.03)" stroke-width="0.5" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.03)" stroke-width="0.5" />

          <!-- Gradient Area -->
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f97316" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#f97316" stop-opacity="0" />
            </linearGradient>
          </defs>
          <path 
            d="M 0,100 L {polylineString} L 100,100 Z" 
            fill="url(#chartGrad)" 
          />

          <!-- Sparkline Path -->
          <polyline 
            fill="none" 
            stroke="#f97316" 
            stroke-width="1.2" 
            points={polylineString}
            class="drop-shadow-[0_4px_8px_rgba(249,115,22,0.5)]"
          />

          <!-- Interactive nodes -->
          {#each chartPoints as point}
            <circle cx={point.x} cy={point.y} r="1.5" fill="#ffffff" stroke="#f97316" stroke-width="1" />
          {/each}
        </svg>

        <!-- Values tags overlaid -->
        <div class="absolute inset-0 flex justify-between items-end px-1 pointer-events-none">
          {#each chartPoints as point}
            <div class="flex flex-col items-center">
              <span class="text-[9px] font-mono text-orange-400 font-bold mb-1 bg-[#090909] border border-white/10 px-1 rounded">${point.total}</span>
              <span class="text-[8px] font-mono text-slate-600">ID: ..{point.id.slice(-4)}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- LOGISTICS REGISTER / ORDER LIST -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- ORDERS CONTROL SHEET -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6 lg:col-span-2">
        <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono mb-6 pb-2 border-b border-white/5">
          Order Logistics Registry ({orders.length})
        </h3>

        <div class="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
          {#if orders.length === 0}
            <p class="text-xs text-slate-600 uppercase tracking-widest font-mono text-center py-20">No orders logged.</p>
          {:else}
            {#each orders as order (order.id)}
              <div class="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-colors">
                <div class="flex flex-col md:flex-row justify-between md:items-center gap-2">
                  <div>
                    <span class="text-[9px] text-slate-500 font-mono uppercase">User ID / Email</span>
                    <p class="text-xs font-semibold text-white truncate max-w-xs">{order.email}</p>
                    <p class="text-[9px] text-slate-400 font-mono uppercase mt-0.5">ID: #{order.id}</p>
                  </div>

                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <span class="text-[9px] text-slate-500 font-mono uppercase block">Total Bill</span>
                      <span class="text-xs font-mono font-bold text-orange-400">${order.total}</span>
                    </div>

                    <!-- Interactive Status Dropdown -->
                    <div class="relative">
                      <select 
                        value={order.status}
                        onchange={(e) => handleStatusChange(order.id, (e.target as HTMLSelectElement).value as Order['status'])}
                        class="bg-black border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white uppercase font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer pr-8 appearance-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <ChevronDown class="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <!-- Products item preview inside order -->
                <div class="bg-black/30 rounded-xl p-3 space-y-2">
                  {#each order.items as item}
                    <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span class="truncate max-w-[250px]">{item.title}</span>
                      <span>{item.quantity} x ${item.price}</span>
                    </div>
                  {/each}
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- USER LIST DIRECTORY -->
      <div class="bg-[#0b0b0b] border border-white/5 rounded-3xl p-6">
        <h3 class="text-xs uppercase tracking-widest text-slate-400 font-mono mb-6 pb-2 border-b border-white/5">
          User Account Registry ({users.length})
        </h3>

        <div class="space-y-4 max-h-[450px] overflow-y-auto pr-1 scrollbar-thin">
          {#if users.length === 0}
            <p class="text-xs text-slate-600 uppercase tracking-widest font-mono text-center py-20">No accounts registered.</p>
          {:else}
            {#each users as u (u.uid)}
              <div class="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                <div class="w-9 h-9 rounded-full border border-white/10 overflow-hidden bg-gradient-to-tr from-slate-800 to-slate-900 flex items-center justify-center">
                  {#if u.photoURL}
                    <img src={u.photoURL} alt={u.displayName} class="w-full h-full object-cover" />
                  {:else}
                    <span class="text-orange-500 font-bold italic text-xs uppercase">
                      {u.displayName ? u.displayName.slice(0, 2) : 'US'}
                    </span>
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-semibold text-white truncate">{u.displayName || 'No Name'}</h4>
                  <p class="text-[9px] text-slate-500 truncate font-mono mt-0.5">{u.email}</p>
                </div>
                {#if u.role === 'admin'}
                  <span class="text-[8px] font-black bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 text-orange-400 rounded uppercase tracking-wider font-mono">Admin</span>
                {:else}
                  <span class="text-[8px] font-black bg-slate-500/10 border border-slate-500/20 px-2 py-0.5 text-slate-400 rounded uppercase tracking-wider font-mono">User</span>
                {/if}
              </div>
            {/each}
          {/if}
        </div>
      </div>

    </div>
  {/if}
</div>
