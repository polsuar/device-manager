import React, { createContext, useContext, useState, useEffect } from "react";
import { initializeFirebase, getFirebaseInstance } from "../config/firebase";

type Environment = "UAT" | "PROD" | "FALLCARE";

interface FirebaseInstances {
  db: any;
  auth: any;
}

interface EnvironmentContextType {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  getFirebase: (env?: Environment) => FirebaseInstances;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export const EnvironmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [environment, setEnvironment] = useState<Environment>("PROD");
  const [isInitialized, setIsInitialized] = useState(false);
  const [firebaseInstances, setFirebaseInstances] = useState<Record<Environment, FirebaseInstances | null>>({
    UAT: null,
    PROD: null,
    FALLCARE: null,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize all environments
        const uatInstance = await initializeFirebase("UAT");
        const prodInstance = await initializeFirebase("PROD");
        const fallcareInstance = await initializeFirebase("FALLCARE");

        setFirebaseInstances({
          UAT: { db: uatInstance.db, auth: uatInstance.auth },
          PROD: { db: prodInstance.db, auth: prodInstance.auth },
          FALLCARE: { db: fallcareInstance.db, auth: fallcareInstance.auth },
        });

        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };

    initialize();

    return () => {
      setIsInitialized(false);
    };
  }, []);

  const getFirebase = (env: Environment = environment) => {
    const instance = firebaseInstances[env];
    if (!instance) {
      throw new Error(`Firebase instance for environment ${env} not initialized`);
    }
    return instance;
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
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
