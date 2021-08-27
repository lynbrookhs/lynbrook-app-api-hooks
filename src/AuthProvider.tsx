import React, {
  createContext,
  PropsWithChildren,
  ReactNode,
  useContext,
  useEffect,
  useState
} from "react";

type AuthContextType = {
  token?: string;
  setToken: (token?: string) => void;
};

const AuthContext = createContext<AuthContextType>({
  token: undefined,
  setToken: () => {}
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  loadToken: () => string | undefined;
  fallback: ReactNode;
};

const AuthProvider = ({ loadToken, fallback, children }: PropsWithChildren<AuthProviderProps>) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      let token = await loadToken();
      if (!token) token = undefined;
      setToken(token);
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken }}>
      {loading ? fallback : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
