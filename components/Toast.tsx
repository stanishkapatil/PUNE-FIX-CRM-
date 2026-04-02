"use client";

import { Toaster, toast } from "react-hot-toast";

export function ToastProvider() {
  return <Toaster position="top-right" />;
}

export { toast };
