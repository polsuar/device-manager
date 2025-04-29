import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Query,
  CollectionReference,
} from "firebase/firestore";
import { getFirebaseInstance } from "../config/firebase";
import { Device, DeviceFilters, DevicePagination } from "../types/device";

const COLLECTION_NAME = "devices";

export const deviceService = {
  async getDevices(filters: DeviceFilters = {}, pagination: DevicePagination): Promise<Device[]> {
    const { db } = getFirebaseInstance();
    let q: CollectionReference | Query = collection(db, COLLECTION_NAME);

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    q = query(q, orderBy("name"), limit(pagination.pageSize));

    if (pagination.page > 0) {
      const lastDoc = await getDocs(query(q, limit(pagination.page * pagination.pageSize)));
      q = query(q, startAfter(lastDoc.docs[lastDoc.docs.length - 1]));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Device));
  },

  async getDevice(id: string): Promise<Device | null> {
    const { db } = getFirebaseInstance();
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Device) : null;
  },

  async createDevice(device: Omit<Device, "id" | "createdAt" | "updatedAt">): Promise<Device> {
    const { db } = getFirebaseInstance();
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...device,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...device, createdAt: now, updatedAt: now };
  },

  async updateDevice(id: string, device: Partial<Device>): Promise<void> {
    const { db } = getFirebaseInstance();
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...device,
      updatedAt: new Date().toISOString(),
    });
  },

  async deleteDevice(id: string): Promise<void> {
    const { db } = getFirebaseInstance();
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  async getTotalDevices(filters: DeviceFilters = {}): Promise<number> {
    const { db } = getFirebaseInstance();
    let q: CollectionReference | Query = collection(db, COLLECTION_NAME);

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }

    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  },
};
