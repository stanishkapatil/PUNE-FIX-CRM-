import { NextResponse } from "next/server";
import { getFirebaseAdminAuth, getFirebaseAdminDb } from "../../../lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = getFirebaseAdminAuth();
  const db = getFirebaseAdminDb();
  try {
    const user = await auth.createUser({ email: "testqa@example.com", password: "password123", displayName: "QA Staff" });
    await db.collection("users").doc(user.uid).set({ role: "staff", email: "testqa@example.com", name: "QA Staff" });
    return NextResponse.json({ created: true });
  } catch(e: any) {
    if (e.code === "auth/email-already-exists") {
      const u = await auth.getUserByEmail("testqa@example.com");
      await auth.updateUser(u.uid, { password: "password123" });
      await db.collection("users").doc(u.uid).set({ role: "staff", email: "testqa@example.com", name: "QA Staff" });
      return NextResponse.json({ updated: true });
    }
    return NextResponse.json({ error: e.message });
  }
}
