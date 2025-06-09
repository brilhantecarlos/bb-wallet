import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { WalletService, Transaction, Wallet } from '../../Service/wallet.service';

@Component({
  selector: 'app-historico',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './historicotrans.component.html',
  styleUrls: ['./historicotrans.component.css']
})
export class HistoricoComponent implements OnInit {
  wallets: Wallet[] = [];
  transacoes: any[] = [];
  loading = true;
  error = '';
  
  constructor(private walletService: WalletService) {}
  
  ngOnInit() {
    this.carregarTransacoes();
  }
  
  onSidebarSelected(event: any) {
    console.log('Sidebar selecionada:', event);
  }
  
  carregarTransacoes() {
    this.loading = true;
    this.walletService.getWallets().subscribe({
      next: (wallets) => {
        this.wallets = wallets;
        if (this.wallets.length > 0) {
          this.buscarTodasTransacoes();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Erro ao carregar carteiras:', err);
        this.error = 'Não foi possível carregar as carteiras. Verifique se o servidor está rodando.';
        this.loading = false;
      }
    });
  }
  
  buscarTodasTransacoes() {
    const promisesTransacoes = this.wallets.map(wallet => {
      return new Promise<any[]>(resolve => {
        this.walletService.getTransactions(wallet.address).subscribe({
          next: (transactions) => {
            const transacoesFormatadas = transactions.map(tx => ({
              id: tx.id,
              txid: tx.txid,
              data: new Date(tx.timestamp).toLocaleString(),
              endereco: wallet.address,
              nome_carteira: wallet.name,
              valor: `${tx.amount.toFixed(8)} BTC`,
              amount: tx.amount,
              fee: tx.fee,
              status: tx.status === 'confirmed' ? 'Confirmada' : 'Pendente',
              type: tx.type
            }));
            resolve(transacoesFormatadas);
          },
          error: () => resolve([])
        });
      });
    });
    
    Promise.all(promisesTransacoes).then(resultados => {
      this.transacoes = resultados.flat();
      this.loading = false;
    });
  }
  
  exportarTransacoes() {
    if (this.transacoes.length === 0) {
      alert('Não há transações para exportar.');
      return;
    }
    
    const headers = 'ID,Data,Endereço,Nome da Carteira,Valor,Taxa,Status,Tipo\n';
    
    const csvContent = this.transacoes.reduce((content, tx) => {
      return content + 
        `${tx.id},${tx.data},${tx.endereco},${tx.nome_carteira},${tx.amount},${tx.fee},${tx.status},${tx.type}\n`;
    }, headers);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacoes_bitcoin_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

