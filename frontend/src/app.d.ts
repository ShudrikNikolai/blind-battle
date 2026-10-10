import type { Admin } from '$lib/types/api';

declare global {
  namespace App {
    interface Locals {
      user: Admin | null;
    }
  }
}

export {};
