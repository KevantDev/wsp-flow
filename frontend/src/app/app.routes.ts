import { Routes } from '@angular/router';
import { authGuard, adminGuard, superAdminGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'landing',
    loadComponent: () =>
      import('./features/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register-store',
    loadComponent: () =>
      import('./features/auth/register-store/register-store.component').then(
        (m) => m.RegisterStoreComponent,
      ),
  },
  {
    path: 'onboarding',
    loadComponent: () =>
      import('./features/auth/register-store/register-store.component').then(
        (m) => m.RegisterStoreComponent,
      ),
  },
  {
    path: 'tienda/:slug',
    loadComponent: () =>
      import('./features/store/store-front.component').then((m) => m.StoreFrontComponent),
  },
  {
    path: 'store/:slug',
    loadComponent: () =>
      import('./features/store/store-front.component').then((m) => m.StoreFrontComponent),
  },
  {
    path: 'pay/:orderNumber',
    loadComponent: () =>
      import('./features/payment/payment-checkout.component').then(
        (m) => m.PaymentCheckoutComponent,
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'live-chat',
        loadComponent: () =>
          import('./features/live-chat/live-chat.component').then((m) => m.LiveChatComponent),
      },
      {
        path: 'broadcasts',
        loadComponent: () =>
          import('./features/broadcasts/broadcasts.component').then((m) => m.BroadcastsComponent),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'settings',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      {
        path: 'admin',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/super-admin-dashboard/super-admin-dashboard.component').then(
            (m) => m.SuperAdminDashboardComponent,
          ),
      },
      {
        path: 'admin/tenants',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/tenants-management/tenants-management.component').then(
            (m) => m.TenantsManagementComponent,
          ),
      },
      {
        path: 'admin/sessions',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/sessions-monitor/sessions-monitor.component').then(
            (m) => m.SessionsMonitorComponent,
          ),
      },
      {
        path: 'admin/plans',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/plans-management/plans-management.component').then(
            (m) => m.PlansManagementComponent,
          ),
      },
      {
        path: 'admin/system',
        canActivate: [superAdminGuard],
        loadComponent: () =>
          import('./features/admin/system-status/system-status.component').then(
            (m) => m.SystemStatusComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
