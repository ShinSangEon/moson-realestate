import { getAuthUserId } from "@/lib/auth";
import NavbarClient from "@/components/NavbarClient";

export default async function Navbar() {
  const userId = await getAuthUserId();
  const isLoggedIn = !!userId;

  return <NavbarClient isLoggedIn={isLoggedIn} />;
}
