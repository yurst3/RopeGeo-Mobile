/**
 * True when the current route is a saved-tab ropewiki page (`.../saved/.../page`).
 * Used to attach "return to saved page" metadata when opening Explore-only routes (e.g. region).
 */
export function isSavedRopewikiPagePath(pathname: string | undefined): boolean {
  if (pathname == null || pathname === "") return false;
  return (
    (pathname.startsWith("/saved/") && pathname.includes("/page")) ||
    (pathname.includes("(tabs)/saved/") && pathname.includes("/page"))
  );
}
