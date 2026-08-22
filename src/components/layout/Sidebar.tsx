import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, LayoutDashboard, Search, History, Settings, Menu, X, ChevronRight } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
{ to: '/scan', icon: Search, label: 'Scan Centre' },
{ to: '/history', icon: History, label: 'History' },
{ to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
const [collapsed, setCollapsed] = useState(false);
const [mobileOpen, setMobileOpen] = useState(false);

return (
<>
{/* Mobile toggle */}
<button
onClick={() => setMobileOpen(!mobileOpen)}
className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-bg-secondary border border-border-subtle text-text-secondary hover:text-text-primary"
aria-label="Toggle navigation menu"
>
{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
</button>

{/* Mobile overlay */}  
  <AnimatePresence>  
    {mobileOpen && (  
      <motion.div  
        initial={{ opacity: 0 }}  
        animate={{ opacity: 1 }}  
        exit={{ opacity: 0 }}  
        className="fixed inset-0 bg-black/60 z-40 lg:hidden"  
        onClick={() => setMobileOpen(false)}  
      />  
    )}  
  </AnimatePresence>  

  {/* Mobile sidebar */}  
  <AnimatePresence>  
    {mobileOpen && (  
      <motion.aside  
        initial={{ x: -300 }}  
        animate={{ x: 0 }}  
        exit={{ x: -300 }}  
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}  
        className="fixed inset-y-0 left-0 z-40 w-64 bg-bg-primary border-r border-border-subtle lg:hidden"  
      >  
        <div className="p-6">  
          <NavLink to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>  
            <div className="h-10 w-10 rounded-xl bg-accent-blue/20 flex items-center justify-center">  
              <Shield className="h-6 w-6 text-accent-blue" />  
            </div>  
            <div>  
              <p className="text-sm font-semibold text-text-primary">{APP_NAME}</p>  
              <p className="text-xs text-text-muted">Enterprise Security</p>  
            </div>  
          </NavLink>  
        </div>  
        <nav className="px-3 space-y-1">  
          {navItems.map((item) => (  
            <NavLink  
              key={item.to}  
              to={item.to}  
              onClick={() => setMobileOpen(false)}  
              className={({ isActive }) =>  
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${  
                  isActive  
                    ? 'bg-accent-blue/10 text-accent-blue'  
                    : 'text-text-secondary hover:text-text-primary hover:bg-white/5'  
                }`  
              }  
            >  
              <item.icon className="h-5 w-5" />  
              {item.label}  
            </NavLink>  
          ))}  
        </nav>  
      </motion.aside>  
    )}  
  </AnimatePresence>  

  {/* Desktop sidebar */}  
  <aside  
    className={`hidden lg:flex flex-col h-screen sticky top-0 bg-bg-primary border-r border-border-subtle transition-all duration-200 ${  
      collapsed ? 'w-16' : 'w-64'  
    }`}  
  >  
    <div className="p-4 flex items-center gap-3 border-b border-border-subtle">  
      <NavLink to="/" className="flex items-center gap-3 flex-1">  
        <div className="h-9 w-9 rounded-xl bg-accent-blue/20 flex items-center justify-center flex-shrink-0">  
          <Shield className="h-5 w-5 text-accent-blue" />  
        </div>  
        {!collapsed && (  
          <div className="overflow-hidden">  
            <p className="text-sm font-semibold text-text-primary truncate">{APP_NAME}</p>  
            <p className="text-[10px] text-text-muted truncate">Enterprise Security</p>  
          </div>  
        )}  
      </NavLink>  
      <button  
        onClick={() => setCollapsed(!collapsed)}  
        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"  
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}  
      >  
        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`} />  
      </button>  
    </div>  

    <nav className="flex-1 p-3 space-y-1">  
      {navItems.map((item) => (  
        <NavLink  
          key={item.to}  
          to={item.to}  
          className={({ isActive }) =>  
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${  
              isActive  
                ? 'bg-accent-blue/10 text-accent-blue'  
                : 'text-text-secondary hover:text-text-primary hover:bg-white/5'  
            }`  
          }  
          title={collapsed ? item.label : undefined}  
        >  
          <item.icon className="h-5 w-5 flex-shrink-0" />  
          {!collapsed && <span>{item.label}</span>}  
        </NavLink>  
      ))}  
    </nav>  

    <div className="p-3 border-t border-border-subtle">  
      <NavLink  
        to="/"  
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-muted hover:text-text-primary hover:bg-white/5 transition-all"  
      >  
        <Shield className="h-5 w-5" />  
        {!collapsed && <span>Home</span>}  
      </NavLink>  
    </div>  
  </aside>  
</>

);
}
