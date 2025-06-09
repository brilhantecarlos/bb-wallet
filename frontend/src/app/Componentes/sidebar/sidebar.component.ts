import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  @Output() selected = new EventEmitter<string>();

  menu = [
    { name: 'Painel', route: '/' },
    { name: 'Histórico de transações', route: '/historico' },
    { name: 'Criar transação', route: '/criar-transacao' },
    { name: 'Carteiras', route: '/carteira' },
    { name: 'UTXOs', route: '/utxos' },
    { name: 'Configurações', route: '/configuracoes' }
  ];

  selectedRoute: string = '/';

  constructor(private router: Router) {
    this.selectedRoute = this.router.url;
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.selectedRoute = event.urlAfterRedirects;
      }
    });
  }

  selectItem(item: any) {
    this.selected.emit(item.name);
    this.selectedRoute = item.route;
    this.router.navigate([item.route]);
  }

  isActive(route: string): boolean {
    return this.selectedRoute === route || this.selectedRoute.startsWith(route + '/');
  }
}