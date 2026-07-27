"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { useMe } from "@/lib/auth/useMe";

export function AccountMenu() {
  const { data } = useMe();
  const name = data && "user" in data && data.user ? data.user.fullName : "My Account";

  const supabase = createSupabaseBrowserClient();
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 0.16;

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/welcome";
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="nav-link text-slate-700 px-3 py-2 rounded-md text-sm font-medium hover:text-teal-600 transition-colors inline-flex items-center"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <i className="fas fa-user-circle mr-2" aria-hidden />
        {name}
        <i className={`fas fa-chevron-down ml-2 text-xs transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden"
            role="menu"
          >
            <div className="p-2">
              <MenuItem icon="fa-gear" label="Settings" onClick={() => setOpen(false)} />
              <MenuItem icon="fa-circle-question" label="FAQs" onClick={() => setOpen(false)} />
              <MenuItem icon="fa-receipt" label="Purchases" onClick={() => setOpen(false)} />
              <MenuItem icon="fa-user-group" label="Refer a friend" onClick={() => setOpen(false)} />

              <div className="mt-2 rounded-xl bg-rose-50 p-1">
                <button
                  type="button"
                  onClick={signOut}
                  className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-rose-800 hover:bg-rose-100 transition"
                  role="menuitem"
                >
                  Sign out
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 transition"
      role="menuitem"
    >
      <i className={`fas ${icon} text-slate-600 w-4 text-center`} aria-hidden />
      <span className="font-medium">{label}</span>
    </button>
  );
}
