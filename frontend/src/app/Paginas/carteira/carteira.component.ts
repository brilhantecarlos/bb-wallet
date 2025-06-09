import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { WalletService, Wallet } from '../../Service/wallet.service';

@Component({
  selector: 'app-carteira',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './carteira.component.html',
  styleUrls: ['./carteira.component.css']
})
export class CarteiraComponent implements OnInit {
  carteirasLocais: Wallet[] = [];
  loading = true;
  error = '';

  constructor(
    private walletService: WalletService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarCarteirasLocais();
  }

  carregarCarteirasLocais(): void {
    this.loading = true;
    this.walletService.getWallets().subscribe({
      next: (data) => {
        this.carteirasLocais = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erro ao carregar carteiras:', err);
        this.loading = false;
        this.error = 'Não foi possível carregar as carteiras. Verifique se o servidor está rodando.';
      }
    });
  }

  removerCarteira(address: string): void {
    if (confirm('Tem certeza que deseja remover esta carteira?')) {
      this.walletService.deleteWallet(address).subscribe({
        next: () => {
          this.carteirasLocais = this.carteirasLocais.filter(c => c.address !== address);
        },
        error: (err) => {
          console.error('Erro ao remover carteira:', err);
        }
      });
    }
  }

  exportarCarteira(wallet: any): void {
    this.router.navigate(['/exportar-carteira'], {
      state: {
        walletData: {
          private_key: wallet.private_key,
          public_key: wallet.public_key,
          address: wallet.address,
          network: wallet.network,
          format: wallet.format,
          method: wallet.method 
        }
      }
    });
  }
}
