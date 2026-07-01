"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}` as Route);
}

export async function signInAction(formData: FormData) {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!email || !password) {
    redirectWithError("/login", "Enter your email and password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirectWithError("/login", error.message);
  }

  redirect("/");
}

export async function signUpAction(formData: FormData) {
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");
  const siteUrl = env("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";

  if (!email || !password) {
    redirectWithError("/signup", "Enter your email and password.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteUrl
    }
  });

  if (error) {
    redirectWithError("/signup", error.message);
  }

  redirect("/?signed_up=1");
}

export async function signInWithGoogleAction() {
  const siteUrl = env("NEXT_PUBLIC_SITE_URL") || "http://localhost:3000";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/`,
      queryParams: {
        access_type: "offline",
        prompt: "select_account"
      }
    }
  });

  if (error || !data.url) {
    redirectWithError("/login", error?.message || "Google sign in is unavailable.");
  }

  redirect(data.url as Route);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
