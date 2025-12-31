import { useCallback } from "react";
import { cache } from "swr";
import { useAuth } from "./AuthProvider";
import { apiPath, useRequest } from "./core";
import { UserType } from "./models";
import { mutate } from "swr";

type Provider = "schoology" | "google";

const KEEP_CALLBACK_FIELDS: { [key in Provider]: string[] } = {
  schoology: ["oauth_token"],
  google: ["code", "state"]
};

export const useSignInWithProvider = (provider: Provider, throw_on_error?: boolean) => {
  const { request, error } = useRequest(throw_on_error);
  const { setToken } = useAuth();

  const makeAuthorizationUri = useCallback(async (redirectUri: string) => {
    const authUrl = apiPath(`/auth/o/${provider}/`);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    const { authorization_url } = (await request("GET", authUrl.toString())) ?? {};
    return authorization_url;
  }, []);

  const handleProviderCallback = useCallback(async (params: { [key: string]: string }) => {
    const body = new URLSearchParams();
    for (const field of KEEP_CALLBACK_FIELDS[provider]) {
      body.append(field, params[field]);
    }

    const { access } =
      (await request("POST", `/auth/o/${provider}/`, body.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      })) ?? {};
    if (access === undefined) return;

    setToken(access);
  }, []);

  return { makeAuthorizationUri, handleProviderCallback, error };
};

export const useSpendPoints = (throw_on_error?: boolean) => {
  const { request, error } = useRequest(throw_on_error);

  const spendPoints = useCallback(async () => {
    const resp = await request("POST", "/users/spend-points/");

    await mutate("/users/me/");
    return resp;
  }, [request]);

  return { spendPoints, error };
};

export const useSignOut = () => {
  const { setToken } = useAuth();
  return useCallback(async () => {
    setToken(undefined);
    cache.clear();
  }, []);
};

type GuestRegisterCredentials = {
  email: string;
  password: string;
  re_password: string;
};

export const useRegisterAsGuest = (throw_on_error?: boolean) => {
  const { request, error } = useRequest(throw_on_error);
  const { signInAsGuest, error: error2 } = useSignInAsGuest(throw_on_error);
  const registerAsGuest = useCallback(async (creds: GuestRegisterCredentials) => {
    const resp = await request("POST", "/auth/users/", {
      ...creds,
      type: UserType.GUEST
    });
    if (resp) await signInAsGuest(creds);
  }, []);
  return { registerAsGuest, error: error ?? error2 };
};

type GuestLoginCredentials = {
  email: string;
  password: string;
};

export const useSignInAsGuest = (throw_on_error?: boolean) => {
  const { request, error } = useRequest(throw_on_error);
  const { setToken } = useAuth();
  const signInAsGuest = useCallback(
    async (creds: GuestLoginCredentials) => {
      const resp = await request("POST", "/auth/jwt/create", creds);
      if (resp?.access === undefined) return;
      setToken(resp.access);
      return resp.access;
    },
    [request]
  );
  return { signInAsGuest, error };
};
