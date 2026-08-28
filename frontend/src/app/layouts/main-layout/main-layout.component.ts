import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="min-h-screen bg-[#F8F9FA] text-zinc-900 flex">
      <!-- Sidebar Responsive -->
      <app-sidebar
        [isOpen]="layoutService.isMobileMenuOpen()"
        (close)="layoutService.closeMenu()"
      ></app-sidebar>

      <!-- Main Content Area -->
      <div class="flex-1 ml-0 lg:ml-64 min-h-screen flex flex-col w-full min-w-0 transition-all duration-300">
        <main class="flex-1 p-3 sm:p-5 md:p-8 max-w-auto w-full mx-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class MainLayoutComponent {
  layoutService = inject(LayoutService);
}
