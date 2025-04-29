import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeFirebase, getFirebaseInstance } from "../config/firebase";

type Environment = "UAT" | "PROD";

interface EnvironmentContextType {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  getFirebase: () => { db: any; auth: any };
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnvironment] = useState<Environment>("PROD");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirebase(environment);
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };

    initialize();

    return () => {
      setIsInitialized(false);
    };
  }, [environment]);

  const getFirebase = () => {
    return getFirebaseInstance();
  };

  if (!isInitialized) {
    return <div>Loading...</div>; // O algún componente de carga
  }

  return <EnvironmentContext.Provider value={{ environment, setEnvironment, getFirebase }}>{children}</EnvironmentContext.Provider>;
};

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
};
