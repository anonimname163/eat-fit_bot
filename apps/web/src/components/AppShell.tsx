'use client';

import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { RegistrationForm } from './RegistrationForm';
import { BottomNav } from './BottomNav';
import { MenuScreen } from './screens/MenuScreen';
import { CartScreen } from './screens/CartScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { AdminScreen } from './screens/AdminScreen';

/** Каркас Mini App: гейт регистрации, затем вкладки + нижняя навигация. */
export function AppShell() {
  const client = useAuthStore((s) => s.client);
  const tab = useUiStore((s) => s.tab);
  if (!client) return null;

  const registered = Boolean(client.phone && client.address);
  if (!registered) {
    return (
      <div className="app">
        <RegistrationForm />
      </div>
    );
  }

  return (
    <div className="app">
      <div className="screen">
        {tab === 'menu' && <MenuScreen />}
        {tab === 'cart' && <CartScreen />}
        {tab === 'orders' && <OrdersScreen />}
        {tab === 'profile' && <ProfileScreen />}
        {tab === 'admin' && <AdminScreen />}
      </div>
      <BottomNav />
    </div>
  );
}
