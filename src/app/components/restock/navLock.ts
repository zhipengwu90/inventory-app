"use client";
// Lets a page stop the user from leaving (e.g. while counting stock).
// The NavBar listens and asks before switching tabs or going back.

export const NAV_LOCK = "restock:nav-lock";

export type NavLock = { locked: boolean; reason?: string };

export const setNavLock = (lock: NavLock): void => {
  window.dispatchEvent(new CustomEvent<NavLock>(NAV_LOCK, { detail: lock }));
};
