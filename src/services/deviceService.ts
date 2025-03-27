import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, DocumentData } from "firebase/firestore";
import { db } from "../config/firebase";
import { Device, DeviceDetail } from "../components/templates/DeviceListTemplate";

const COLLECTION_NAME = "devices";

export const deviceService = {
  // Obtener todos los dispositivos con paginación
  async getDevices(
    page: number,
    pageSize: number,
    filters: {
      search?: string;
      status?: string;
      type?: string;
    } = {}
  ) {
    let q = collection(db, COLLECTION_NAME);

    // Aplicar filtros
    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    // Ordenar y paginar
    q = query(q, orderBy("name"), limit(pageSize));

    if (page > 0) {
      const lastDoc = await this.getLastVisibleDoc(page - 1, pageSize, filters);
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
    }

    const querySnapshot = await getDocs(q);
    const devices = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Device[];

    // Filtrar por búsqueda si es necesario
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return devices.filter((device) => device.name.toLowerCase().includes(searchLower));
    }

    return devices;
  },

  // Obtener el último documento visible para la paginación
  async getLastVisibleDoc(
    page: number,
    pageSize: number,
    filters: {
      status?: string;
      type?: string;
    } = {}
  ) {
    let q = collection(db, COLLECTION_NAME);

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    q = query(q, orderBy("name"), limit(pageSize * (page + 1)));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[querySnapshot.docs.length - 1];
  },

  // Obtener un dispositivo por ID
  async getDeviceById(id: string): Promise<DeviceDetail | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as DeviceDetail;
    }
    return null;
  },

  // Crear un nuevo dispositivo
  async createDevice(device: Omit<DeviceDetail, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...device,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  },

  // Actualizar un dispositivo
  async updateDevice(id: string, device: Partial<DeviceDetail>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...device,
      updatedAt: new Date().toISOString(),
    });
  },

  // Eliminar un dispositivo
  async deleteDevice(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  },

  // Obtener el total de dispositivos
  async getTotalDevices(
    filters: {
      status?: string;
      type?: string;
    } = {}
  ): Promise<number> {
    let q = collection(db, COLLECTION_NAME);

    if (filters.status) {
      q = query(q, where("status", "==", filters.status));
    }
    if (filters.type) {
      q = query(q, where("type", "==", filters.type));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },
};
