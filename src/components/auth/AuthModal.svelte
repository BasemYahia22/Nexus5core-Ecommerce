<script lang="ts">
  import { auth, googleProvider } from '../../services/firebase';
  import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail, 
    signInWithPopup 
  } from 'firebase/auth';
  import { store } from '../../lib/store.svelte';
  import { X, Mail, Lock, User, LogIn, Sparkles } from 'lucide-svelte';

  // Svelte 5 props
  let { isOpen = $bindable(false) } = $props();

  let mode = $state<'login' | 'register' | 'forgot'>('login');
  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let displayName = $state('');
  let loading = $state(false);

  async function handleAuth(e: Event) {
    e.preventDefault();
    if (!email) {
      store.addToast('Please enter your email', 'warning');
      return;
    }

    loading = true;
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        store.addToast('Welcome back!', 'success');
        isOpen = false;
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          store.addToast('Passwords do not match', 'error');
          loading = false;
          return;
        }
        if (password.length < 6) {
          store.addToast('Password must be at least 6 characters', 'warning');
          loading = false;
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
        store.addToast('Account created successfully!', 'success');
        isOpen = false;
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        store.addToast('Password reset link sent to your email!', 'success');
        mode = 'login';
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already in use';
      } else if (err.code === 'auth/invalid-credential') {
        errMsg = 'Invalid credentials provided';
      }
      store.addToast(errMsg, 'error');
    } finally {
      loading = false;
    }
  }

  async function handleGoogleLogin() {
    loading = true;
    try {
      await signInWithPopup(auth, googleProvider);
      store.addToast('تم تسجيل الدخول بنجاح باستخدام حساب Google!', 'success');
      isOpen = false;
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      
      // Handle known iframe and domain restriction errors
      if (err.code === 'auth/unauthorized-domain') {
        store.addToast('خطأ: يجب إضافة هذا النطاق (Domain) إلى Authorized Domains في إعدادات Firebase Console لتفعيل الدخول بجوجل.', 'error');
      } else if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        store.addToast('تم حظر النافذة المنبثقة. يرجى فتح التطبيق في نافذة جديدة (New Tab) وتجربة تسجيل الدخول.', 'error');
      } else if (err.code === 'auth/operation-not-allowed') {
        store.addToast('تسجيل الدخول بجوجل غير مفعل في Firebase Console. يرجى تفعيله من قسم Authentication.', 'error');
      } else {
        // Fallback friendly message for iframe environment
        store.addToast('لا يمكن إتمام تسجيل الدخول عبر Google داخل الإطار (Iframe). يرجى فتح التطبيق في نافذة مستقلة (New Tab).', 'error');
      }
    } finally {
      loading = false;
    }
  }

  function toggleMode(newMode: 'login' | 'register' | 'forgot') {
    mode = newMode;
    email = '';
    password = '';
    confirmPassword = '';
    displayName = '';
  }
</script>

{#if isOpen}
  <!-- Overlay Backdrop -->
  <div 
    class="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
  >
    <!-- Modal Box -->
    <div 
      class="w-full max-w-md bg-[#090909]/95 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_12px_48px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col"
    >
      <!-- Background glowing orb -->
      <div class="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full"></div>
      
      <!-- Close Button -->
      <button 
        onclick={() => isOpen = false}
        class="absolute top-4 right-4 text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-full transition-all z-10"
        aria-label="Close"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- Scrollable content wrapper to avoid clipping elements on register mode -->
      <div class="overflow-y-auto flex-1 pr-1 -mr-1 space-y-6">
        <!-- Headings -->
        <div>
          <h2 class="text-2xl font-light tracking-tight text-white">
            {#if mode === 'login'}
              Welcome <span class="italic font-serif text-orange-500">Back</span>
            {:else if mode === 'register'}
              Create <span class="italic font-serif text-orange-500">Account</span>
            {:else}
              Reset <span class="italic font-serif text-orange-500">Password</span>
            {/if}
          </h2>
          <p class="text-xs text-slate-500 uppercase tracking-widest mt-1">
            {#if mode === 'login'}
              Sign in to your premium experience
            {:else if mode === 'register'}
              Join the premium store today
            {:else}
              We'll send you recovery instructions
            {/if}
          </p>
        </div>

        <!-- Auth Form -->
        <form onsubmit={handleAuth} class="space-y-4">
          {#if mode === 'register'}
            <div class="space-y-1.5">
              <label for="name" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
              <div class="relative">
                <User class="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input 
                  id="name"
                  type="text" 
                  placeholder="John Doe" 
                  bind:value={displayName}
                  class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                  required
                />
              </div>
            </div>
          {/if}

          <div class="space-y-1.5">
            <label for="email" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Email Address</label>
            <div class="relative">
              <Mail class="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
              <input 
                id="email"
                type="email" 
                placeholder="name@example.com" 
                bind:value={email}
                class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                required
              />
            </div>
          </div>

          {#if mode !== 'forgot'}
            <div class="space-y-1.5">
              <div class="flex justify-between items-center">
                <label for="password" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Password</label>
                {#if mode === 'login'}
                  <button 
                    type="button" 
                    onclick={() => toggleMode('forgot')}
                    class="text-[10px] uppercase tracking-wider text-orange-500 hover:underline font-mono"
                  >
                    Forgot?
                  </button>
                {/if}
              </div>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  bind:value={password}
                  class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                  required
                />
              </div>
            </div>
          {/if}

          {#if mode === 'register'}
            <div class="space-y-1.5">
              <label for="confirm" class="text-[10px] uppercase tracking-wider text-slate-400 font-mono">Confirm Password</label>
              <div class="relative">
                <Lock class="w-4 h-4 text-slate-500 absolute left-4 top-3.5" />
                <input 
                  id="confirm"
                  type="password" 
                  placeholder="••••••••" 
                  bind:value={confirmPassword}
                  class="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 transition-all"
                  required
                />
              </div>
            </div>
          {/if}

          <button 
            type="submit" 
            disabled={loading}
            class="w-full bg-orange-500 text-black py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_4px_20px_rgba(249,115,22,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <LogIn class="w-4 h-4" />
            {#if loading}
              Processing...
            {:else if mode === 'login'}
              Sign In
            {:else if mode === 'register'}
              Register Now
            {:else}
              Send Recovery Email
            {/if}
          </button>
        </form>

        <!-- Google authentication divider -->
        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-white/5"></div>
          <span class="flex-shrink mx-4 text-slate-600 text-[10px] uppercase tracking-widest font-mono">or continue with</span>
          <div class="flex-grow border-t border-white/5"></div>
        </div>

        <!-- Google Button -->
        <button 
          type="button" 
          onclick={handleGoogleLogin}
          disabled={loading}
          class="w-full bg-white/5 border border-white/10 text-white py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
        >
          <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.6 15.01 1 12 1 7.35 1 3.39 3.67 1.44 7.56l3.85 3C6.24 7.42 8.89 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.77 2.92c2.2-2.03 3.48-5.02 3.48-8.64z" />
            <path fill="#FBBC05" d="M5.29 14.56c-.25-.74-.39-1.53-.39-2.36s.14-1.62.39-2.36l-3.85-3C.53 8.42 0 10.15 0 12s.53 3.58 1.44 5.16l3.85-3z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.77-2.92c-1.1.74-2.52 1.18-4.19 1.18-3.11 0-5.76-2.38-6.71-5.52l-3.85 3C3.39 20.33 7.35 23 12 23z" />
          </svg>
          Google Account
        </button>

        <!-- Toggle Modes -->
        <div class="text-center text-xs text-slate-500 pt-2">
          {#if mode === 'login'}
            Don't have an account? 
            <button onclick={() => toggleMode('register')} class="text-orange-500 hover:underline ml-1 font-bold">Register</button>
          {:else if mode === 'register'}
            Already have an account? 
            <button onclick={() => toggleMode('login')} class="text-orange-500 hover:underline ml-1 font-bold">Sign In</button>
          {:else}
            Back to 
            <button onclick={() => toggleMode('login')} class="text-orange-500 hover:underline ml-1 font-bold">Sign In</button>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
