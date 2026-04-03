// This file provides a convenient alias for importing the Firestore database instance.
// It re-exports the Firestore instance as `db` to match existing import statements.

import { getFirebaseAdminDb } from "./firebase/admin";

// Export the Firestore instance under the name `db`.
export const db = getFirebaseAdminDb();
