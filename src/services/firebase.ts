/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { 
  initializeFirestore,
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { UserProfile, CartItem, Address, Order } from '../types';

// Web App Configuration
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
console.log(firebaseConfig);
const auth = getAuth(app);

// Use custom Firestore Database ID if custom Firebase project is configured, otherwise use fallback AI Studio DB ID
const customDbId = env.VITE_FIREBASE_FIRESTORE_DB_ID;
const hasCustomProject = !!env.VITE_FIREBASE_PROJECT_ID;
const dbId = hasCustomProject ? (customDbId || "") : "ai-studio-869eae1b-404a-4b1b-9beb-7288b34c7c79";

const db = dbId ? initializeFirestore(app, {}, dbId) : initializeFirestore(app, {});


// Configure Persistance
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error("Firebase persistence configuration failed:", err);
});

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };

// --- FIRESTORE USER PROFILE HELPERS ---

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

export async function createUserProfile(uid: string, email: string, displayName: string, photoURL?: string): Promise<UserProfile> {
  const profile: UserProfile = {
    uid,
    email,
    displayName: displayName || email.split('@')[0],
    photoURL: photoURL || '',
    role: email.toLowerCase().includes('admin') || email.toLowerCase() === 'basmyhy496@gmail.com' ? 'admin' : 'user',
    createdAt: new Date().toISOString(),
    addresses: []
  };

  try {
    await setDoc(doc(db, 'users', uid), profile);
    return profile;
  } catch (error) {
    console.error("Error creating user profile:", error);
    return profile;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, data);
  } catch (error) {
    console.error("Error updating user profile:", error);
  }
}

// --- CART PERSISTENCE ---

export async function saveCartToFirestore(uid: string, cartItems: CartItem[]): Promise<void> {
  try {
    const cartDocRef = doc(db, 'carts', uid);
    await setDoc(cartDocRef, { items: cartItems, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error saving cart to firestore:", error);
  }
}

export async function loadCartFromFirestore(uid: string): Promise<CartItem[]> {
  try {
    const cartDocRef = doc(db, 'carts', uid);
    const docSnap = await getDoc(cartDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.items || []) as CartItem[];
    }
    return [];
  } catch (error) {
    console.error("Error loading cart from firestore:", error);
    return [];
  }
}

// --- WISHLIST PERSISTENCE ---

export async function saveWishlistToFirestore(uid: string, productIds: number[]): Promise<void> {
  try {
    const wishlistDocRef = doc(db, 'wishlists', uid);
    await setDoc(wishlistDocRef, { productIds, updatedAt: new Date().toISOString() });
  } catch (error) {
    console.error("Error saving wishlist to firestore:", error);
  }
}

export async function loadWishlistFromFirestore(uid: string): Promise<number[]> {
  try {
    const wishlistDocRef = doc(db, 'wishlists', uid);
    const docSnap = await getDoc(wishlistDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.productIds || []) as number[];
    }
    return [];
  } catch (error) {
    console.error("Error loading wishlist from firestore:", error);
    return [];
  }
}

// --- ORDER ACTIONS ---

export async function saveOrderToFirestore(order: Omit<Order, 'id'>): Promise<string> {
  try {
    const ordersCol = collection(db, 'orders');
    const docRef = await addDoc(ordersCol, order);
    // update order doc with the generated id
    await updateDoc(doc(db, 'orders', docRef.id), { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
}

export async function getUserOrders(uid: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const q = query(ordersCol, where('userId', '==', uid));
    const querySnapshot = await getDocs(q);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    // Sort orders by createdAt descending
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return [];
  }
}

export async function getAllOrders(): Promise<Order[]> {
  try {
    const ordersCol = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersCol);
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push(doc.data() as Order);
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  try {
    const orderDocRef = doc(db, 'orders', orderId);
    await updateDoc(orderDocRef, { status });
  } catch (error) {
    console.error("Error updating order status:", error);
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const usersCol = collection(db, 'users');
    const querySnapshot = await getDocs(usersCol);
    const users: UserProfile[] = [];
    querySnapshot.forEach((doc) => {
      users.push(doc.data() as UserProfile);
    });
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}
