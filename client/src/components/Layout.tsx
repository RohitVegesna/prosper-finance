import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  TrendingUp, 
  LogOut, 
  Menu,
  X,
  User,
  Users,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = (user as any)?.role === 'admin';
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Policies', href: '/policies', icon: ShieldCheck },
    { name: 'Investments', href: '/investments', icon: TrendingUp },
    ...(isAdmin ? [{ name: 'Access', href: '/access', icon: Users }] : []),
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar - Dark modern sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-sidebar text-sidebar-foreground h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 font-display text-xl font-bold">
            <div className="p-2 bg-primary rounded-xl">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-sidebar-foreground">Prosper</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="h-10 w-10 border-2 border-sidebar-border">
                  <AvatarImage src={user?.profileImageUrl || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-sidebar-foreground">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'My Account'}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {(user as any)?.domain || user?.email}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <ShieldCheck className="w-6 h-6" />
            <span>Prosper</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-medium transition-colors ${
                      location === item.href
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                ))}
                <div className="border-t border-border mt-auto pt-4">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
