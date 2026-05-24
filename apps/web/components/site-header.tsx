import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Badge } from "~/components/ui/badge";

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">HexForm Control</h1>
        <Badge
          variant="outline"
          className="ml-2 hidden border-primary/40 text-primary sm:inline-flex"
        >
          Live Ops
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild size="sm" className="hidden border-accent/40 sm:flex">
            <a href="/explore">Explore</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
