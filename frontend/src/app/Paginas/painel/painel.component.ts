import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WalletService, Wallet, Transaction } from '../../Service/wallet.service';

@Component({
  selector: 'app-painel',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './painel.component.html',
  styleUrls: ['./painel.component.css']
})
export class PainelComponent implements OnInit {
  selectedSection = 'Painel';
  wallets: Wallet[] = [];
  totalTransactions = 0;
  totalBalance = 0;
  loading = true;
  error = '';

  constructor(private walletService: WalletService) {}

  ngOnInit(): void {
    this.carregarCarteiras();
  }

  onMenuChange(section: string) {
    this.selectedSection = section;
  }

  carregarCarteiras(): void {
    this.loading = true;
    this.walletService.getWallets().subscribe({
      next: (data) => {
        this.wallets = data;
        this.loading = false;
        
        if (this.wallets.length > 0) {
          this.carregarTransacoesETotais();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar carteiras:', err);
        this.loading = false;
        this.error = 'Não foi possível carregar as carteiras. Verifique se o servidor está rodando.';
      }
    });
  }

  carregarTransacoesETotais(): void {
    this.totalTransactions = 0;
    this.totalBalance = 0;
    
    const carteirasProcessadas = new Set();
    
    this.wallets.forEach(wallet => {
      if (!carteirasProcessadas.has(wallet.address)) {
        carteirasProcessadas.add(wallet.address);
        
        this.walletService.getTransactions(wallet.address).subscribe({
          next: (transactions) => {
            this.totalTransactions += transactions.length;
          },
          error: (err) => {
            console.error(`Erro ao carregar transações para ${wallet.address}:`, err);
          }
        });
        
        this.walletService.getBalance(wallet.address).subscribe({
          next: (data) => {
            if (data) {
              const confirmedBalance = data.balance || data.confirmed || 0;
              const unconfirmedBalance = data.unconfirmed || 0;
              // Soma em satoshis - não converte para BTC ainda
              this.totalBalance += confirmedBalance + unconfirmedBalance;
              console.log(`Wallet ${wallet.address} balance: confirmed=${confirmedBalance}, unconfirmed=${unconfirmedBalance}, total=${this.totalBalance}`);
            }
          },
          error: (err) => {
            console.error(`Erro ao carregar saldo para ${wallet.address}:`, err);
          }
        });
      }
    });
  }
  
  // Helper method to safely format BTC values
  formatBtcValue(satoshis: number): string {
    if (satoshis === undefined || satoshis === null || isNaN(satoshis)) {
      return '0.00000000';
    }
    // Convert from satoshis to BTC
    const btcValue = satoshis / 100000000;
    return btcValue.toFixed(8);
  }
}
