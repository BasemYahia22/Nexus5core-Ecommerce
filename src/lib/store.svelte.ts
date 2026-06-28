import { auth, getUserProfile, createUserProfile, saveCartToFirestore, loadCartFromFirestore, saveWishlistToFirestore, loadWishlistFromFirestore } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { Product, CartItem, UserProfile, ToastMessage } from '../types';

class Store {
  user = $state<UserProfile | null>(null);
  currentView = $state<string>('shop');
  selectedProductId = $state<number | null>(null); // For viewing product details
  cartOpen = $state<boolean>(false);
  cart = $state<CartItem[]>([]);
  selectedCategory = $state<string>('all');
  searchQuery = $state<string>('');
  maxPrice = $state<number>(3000);
  sortBy = $state<string>('default');
  wishlist = $state<number[]>([]);
  theme = $state<string>('dark');
  toasts = $state<ToastMessage[]>([]);

  // Derived properties
  cartSubtotal = $derived(
    this.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );

  cartTotalItems = $derived(
    this.cart.reduce((sum, item) => sum + item.quantity, 0)
  );

  shippingCost = $derived(
    this.cartSubtotal >= 150 || this.cartSubtotal === 0 ? 0 : 15
  );

  cartTotal = $derived(
    this.cartSubtotal + this.shippingCost
  );

  constructor() {
    // Theme initialization
    if (typeof window !== 'undefined') {
      this.theme = localStorage.getItem('theme') || 'dark';
      this.applyTheme();
    }

    // Listen to Auth State
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = await createUserProfile(
            firebaseUser.uid,
            firebaseUser.email || '',
            firebaseUser.displayName || 'Guest User',
            firebaseUser.photoURL || undefined
          );
        }
        this.user = profile;
        
        // Sync Cart & Wishlist from Firestore
        const savedCart = await loadCartFromFirestore(firebaseUser.uid);
        if (savedCart && savedCart.length > 0) {
          this.cart = savedCart;
        } else if (this.cart.length > 0) {
          await saveCartToFirestore(firebaseUser.uid, this.cart);
        }

        const savedWishlist = await loadWishlistFromFirestore(firebaseUser.uid);
        this.wishlist = savedWishlist || [];
      } else {
        this.user = null;
        // Load guest data from localStorage for a fully public experience
        if (typeof window !== 'undefined') {
          const localCart = localStorage.getItem('nexus_cart');
          const localWish = localStorage.getItem('nexus_wishlist');
          this.cart = localCart ? JSON.parse(localCart) : [];
          this.wishlist = localWish ? JSON.parse(localWish) : [];
        } else {
          this.cart = [];
          this.wishlist = [];
        }
        if (this.currentView === 'dashboard' || this.currentView === 'admin' || this.currentView === 'checkout') {
          this.currentView = 'shop';
        }
      }
    });
  }

  addToast(message: string, type: ToastMessage['type'] = 'info') {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts = [...this.toasts, { id, message, type }];
    setTimeout(() => {
      this.removeToast(id);
    }, 4000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  async addToCart(product: Product) {
    const existing = this.cart.find(item => item.product.id === product.id);
    if (existing) {
      existing.quantity += 1;
      this.cart = [...this.cart];
    } else {
      this.cart = [...this.cart, { product, quantity: 1 }];
    }
    
    this.addToast(`${product.title} added to bag`, 'success');

    if (this.user) {
      await saveCartToFirestore(this.user.uid, this.cart);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_cart', JSON.stringify(this.cart));
    }
  }

  async removeFromCart(productId: number) {
    this.cart = this.cart.filter(item => item.product.id !== productId);
    this.addToast('Item removed from bag', 'info');

    if (this.user) {
      await saveCartToFirestore(this.user.uid, this.cart);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_cart', JSON.stringify(this.cart));
    }
  }

  async updateCartQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      await this.removeFromCart(productId);
      return;
    }
    const item = this.cart.find(i => i.product.id === productId);
    if (item) {
      item.quantity = quantity;
      this.cart = [...this.cart];
      if (this.user) {
        await saveCartToFirestore(this.user.uid, this.cart);
      } else if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_cart', JSON.stringify(this.cart));
      }
    }
  }

  async clearCart() {
    this.cart = [];
    if (this.user) {
      await saveCartToFirestore(this.user.uid, []);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('nexus_cart');
    }
  }

  async toggleWishlist(productId: number) {
    if (this.wishlist.includes(productId)) {
      this.wishlist = this.wishlist.filter(id => id !== productId);
      this.addToast('Removed from wishlist', 'info');
    } else {
      this.wishlist = [...this.wishlist, productId];
      this.addToast('Added to wishlist', 'success');
    }

    if (this.user) {
      await saveWishlistToFirestore(this.user.uid, this.wishlist);
    } else if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_wishlist', JSON.stringify(this.wishlist));
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', this.theme);
      this.applyTheme();
    }
  }

  applyTheme() {
    if (typeof window !== 'undefined') {
      if (this.theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
  }
}

export const store = new Store();
