import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { BentoCardComponent } from '../../shared/components/bento-card/bento-card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { UsersService } from '../../core/services/users.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, BentoCardComponent, BadgeComponent],
  template: `
    <app-navbar title="Gestión de Subadministradores" subtitle="Control de accesos, roles y permisos de equipo"></app-navbar>

    <div class="space-y-6 mt-6">
      
      <!-- Top Actions -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h3 class="text-sm font-bold text-zinc-900">Miembros del Equipo</h3>
          <p class="text-xs text-zinc-500 font-normal mt-0.5">Los Subadministradores tienen acceso a catálogo, pedidos y atención en vivo.</p>
        </div>

        <button (click)="openCreateModal()" class="btn-primary self-start sm:self-auto whitespace-nowrap">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Registrar Subadministrador</span>
        </button>
      </div>

      <!-- Users Bento Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        @for (user of users(); track user.id) {
          <app-bento-card customClass="flex flex-col justify-between group hover:border-zinc-300">
            <div>
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <img
                    [src]="user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'"
                    [alt]="user.fullName"
                    class="w-11 h-11 rounded-2xl object-cover border border-zinc-200 shadow-sm"
                  />
                  <div>
                    <h4 class="font-bold text-zinc-900 text-sm leading-tight">{{ user.fullName }}</h4>
                    <p class="text-xs text-zinc-500 font-mono mt-0.5">{{ user.email }}</p>
                  </div>
                </div>

                <app-badge [variant]="user.role === 'ADMIN' ? 'purple' : 'info'">
                  {{ user.role === 'ADMIN' ? 'Administrador' : 'Subadmin' }}
                </app-badge>
              </div>

              <!-- Details -->
              <div class="space-y-2 py-3 border-t border-zinc-100 text-xs">
                <div class="flex items-center justify-between text-zinc-500">
                  <span class="font-mono text-[11px] uppercase">Teléfono:</span>
                  <span class="text-zinc-800 font-mono">{{ user.phoneNumber || 'No especificado' }}</span>
                </div>
                <div class="flex items-center justify-between text-zinc-500">
                  <span class="font-mono text-[11px] uppercase">Estado de Cuenta:</span>
                  <span [class]="user.isActive ? 'text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 inline-flex items-center gap-1' : 'text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60 inline-flex items-center gap-1'">
                    <span [class]="'w-1.5 h-1.5 rounded-full ' + (user.isActive ? 'bg-emerald-500' : 'bg-rose-500')"></span>
                    {{ user.isActive ? 'Activo' : 'Desactivado' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- User Actions -->
            @if (user.role !== 'ADMIN') {
              <div class="pt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <button
                  (click)="toggleStatus(user)"
                  [class]="user.isActive ? 'btn-secondary flex-1 py-1.5 text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200/80' : 'btn-primary flex-1 py-1.5 text-xs'"
                >
                  {{ user.isActive ? 'Pausar Acceso' : 'Reactivar Acceso' }}
                </button>

                <button
                  (click)="deleteUser(user)"
                  class="btn-danger p-2 text-xs"
                  title="Eliminar usuario"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            } @else {
              <div class="pt-4 border-t border-zinc-100 text-center">
                <span class="inline-flex items-center gap-1 text-zinc-400 font-mono text-[10px] font-semibold uppercase tracking-wider">
                  <span class="text-amber-500">👑</span>
                  Administrador Principal
                </span>
              </div>
            }
          </app-bento-card>
        }
      </div>

    </div>

    <!-- Create Subadmin Modal -->
    @if (isModalOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-fade-in">
        <div class="relative w-full max-w-md rounded-3xl bg-white border border-zinc-200 shadow-2xl p-6 md:p-8">
          
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-bold text-zinc-900">Nuevo Subadministrador</h3>
            <button (click)="isModalOpen.set(false)" class="p-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveSubadmin()" class="space-y-4">
            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Nombre Completo</label>
              <input type="text" [(ngModel)]="formData.fullName" name="fullName" required placeholder="Martín Silva" class="input-bento" />
            </div>

            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Correo Electrónico</label>
              <input type="email" [(ngModel)]="formData.email" name="email" required placeholder="operador@wspflow.com" class="input-bento" />
            </div>

            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Contraseña de Acceso</label>
              <input type="password" [(ngModel)]="formData.password" name="password" required placeholder="••••••••" class="input-bento" />
            </div>

            <div>
              <label class="block text-zinc-500 font-mono text-[11px] uppercase tracking-wider font-semibold mb-1">Teléfono (Opcional)</label>
              <input type="text" [(ngModel)]="formData.phoneNumber" name="phoneNumber" placeholder="+54911..." class="input-bento font-mono" />
            </div>

            <div class="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
              <button type="button" (click)="isModalOpen.set(false)" class="btn-secondary">Cancelar</button>
              <button type="submit" class="btn-primary">Crear Cuenta</button>
            </div>
          </form>

        </div>
      </div>
    }
  `,
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private toast = inject(ToastService);

  users = signal<User[]>([]);
  isModalOpen = signal(false);

  formData = {
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.usersService.getUsers().subscribe({
      next: (data: any) =>
        this.users.set(
          Array.isArray(data)
            ? data
            : data?.users && Array.isArray(data.users)
            ? data.users
            : [],
        ),
      error: () => this.users.set([]),
    });
  }

  openCreateModal() {
    this.formData = {
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
    };
    this.isModalOpen.set(true);
  }

  saveSubadmin() {
    this.usersService.registerSubadmin(this.formData).subscribe({
      next: () => {
        this.isModalOpen.set(false);
        this.loadUsers();
      },
    });
  }

  toggleStatus(user: User) {
    this.usersService.toggleUserStatus(user.id).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u)),
        );
        this.toast.success(`Usuario ${updated.isActive ? 'activado' : 'desactivado'} exitosamente.`);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al cambiar estado del usuario.');
      },
    });
  }

  async deleteUser(user: User) {
    const confirmed = await this.toast.confirm({
      title: 'Eliminar Usuario',
      message: `¿Estás seguro de eliminar a "${user.fullName}" del equipo? Esta acción no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      type: 'danger',
    });

    if (confirmed) {
      this.usersService.deleteUser(user.id).subscribe({
        next: () => {
          this.toast.success(`Usuario "${user.fullName}" eliminado con éxito.`);
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error al eliminar usuario.');
        },
      });
    }
  }
}
