import React, {
  createContext,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from "react";
import { SWRInfiniteResponse, SWRResponse } from "swr";
import { Error } from "./core";

type AuthContextType = {
  token?: string;
  setToken: (token?: string) => void;
  afterRequest: (
    res: SWRResponse<any, Error> | SWRInfiniteResponse<any, Error>
  ) => void | Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  token: undefined,
  setToken: () => {},
  afterRequest: () => {}
});

export const useAuth = () => useContext(AuthContext);

type AuthProviderProps = {
  loadToken: () => Promise<string | undefined>;
  onTokenChange: (token: string | undefined) => Promise<void>;
  fallback: ReactNode;
} & Pick<AuthContextType, "afterRequest">;

const AuthProvider = ({
  loadToken,
  onTokenChange,
  afterRequest,
  fallback,
  children
}: PropsWithChildren<AuthProviderProps>) => {
  const [loading, setLoading] = useState(true);
  const [token, _setToken] = useState<string | undefined>(undefined);

  const setToken = useCallback(async (token: string | undefined) => {
    await onTokenChange(token);
    _setToken(token);
  }, []);

  useEffect(() => {
    (async () => {
      let token = await loadToken();
      if (!token) token = undefined;
      setToken(token);
      setLoading(false);
    })();
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, afterRequest }}>
      {loading ? fallback : children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
