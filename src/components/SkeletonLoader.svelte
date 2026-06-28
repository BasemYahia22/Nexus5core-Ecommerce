<script lang="ts">
  let { count = 6 }: { count?: number } = $props();
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 flex-1">
  {#each Array(count) as _}
    <div class="bg-[#0d0d0d] border border-white/5 rounded-3xl p-5 flex flex-col gap-4 animate-pulse select-none">
      <!-- Image box placeholder -->
      <div class="h-44 md:h-48 bg-white/5 rounded-2xl w-full"></div>
      
      <!-- Text details -->
      <div class="space-y-3">
        <!-- Category -->
        <div class="h-3 bg-white/5 rounded-full w-1/3"></div>
        <!-- Title -->
        <div class="h-5 bg-white/5 rounded-full w-3/4"></div>
        <!-- Rating -->
        <div class="h-4 bg-white/5 rounded-full w-1/4"></div>
      </div>

      <!-- Pricing and button row -->
      <div class="mt-auto pt-4 flex justify-between items-center">
        <div class="space-y-2">
          <div class="h-3 bg-white/5 rounded-full w-8"></div>
          <div class="h-5 bg-white/5 rounded-full w-16"></div>
        </div>
        <div class="flex gap-2">
          <div class="w-10 h-10 bg-white/5 rounded-xl"></div>
          <div class="w-10 h-10 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    </div>
  {/each}
</div>
