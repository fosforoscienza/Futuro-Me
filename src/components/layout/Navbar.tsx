import { NavbarClient } from "./NavbarClient";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-surface/70 backdrop-blur-xl">
      <NavbarClient />
    </nav>
  );
}
