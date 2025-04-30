import { collection, getDocs, query, where, orderBy, limit, doc, Timestamp } from "firebase/firestore";
import { getFirebaseInstance } from "../config/firebase";
import { NetworkLog, NetworkLogFilters } from "../types/device";

export const networkLogService = {
  async getNetworkLogs(userId: string, filters?: NetworkLogFilters, pageSize: number = 50): Promise<NetworkLog[]> {
    try {
      const { db } = getFirebaseInstance();
      const logsRef = collection(doc(db, "users", userId), "NETWORK_LOGS");

      let q = query(logsRef, orderBy("timestamp", "desc"), limit(pageSize));

      if (filters?.startDate) {
        q = query(q, where("timestamp", ">=", Timestamp.fromDate(filters.startDate)));
      }
      if (filters?.endDate) {
        q = query(q, where("timestamp", "<=", Timestamp.fromDate(filters.endDate)));
      }
      if (filters?.networkType) {
        q = query(q, where("networkType", "==", filters.networkType));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        ...doc.data(),
        timestamp: doc.data().timestamp,
      })) as NetworkLog[];
    } catch (error) {
      console.error("Error fetching network logs:", error);
      throw error;
    }
  },

  async getNetworkTypes(userId: string): Promise<string[]> {
    try {
      const { db } = getFirebaseInstance();
      const logsRef = collection(doc(db, "users", userId), "NETWORK_LOGS");
      const snapshot = await getDocs(query(logsRef, orderBy("timestamp", "desc"), limit(100)));

      const types = new Set<string>();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.networkType) {
          types.add(data.networkType);
        }
      });

      return Array.from(types);
    } catch (error) {
      console.error("Error fetching network types:", error);
      throw error;
    }
  },
};
