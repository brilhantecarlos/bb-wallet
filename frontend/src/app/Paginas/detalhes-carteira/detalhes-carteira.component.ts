import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { WalletService, Wallet, Transaction, UTXO } from '../../Service/wallet.service';
import { DOCUMENT } from '@angular/common';  
import { Inject } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-detalhes-carteira',
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  templateUrl: './detalhes-carteira.component.html',
  styleUrls: ['./detalhes-carteira.component.css']
})
export class DetalhesCarteiraComponent implements OnInit {
  nomeCarteira: string = '';
  endereco: string = '';
  saldo: number = 0;
  
  carteira: Wallet | null = null;
  transacoes: Transaction[] = [];
  utxos: UTXO[] = [];
  saldoAtual: number = 0;
  carregandoCarteira = true;
  carregandoTransacoes = true;
  carregandoUTXOs = true;
  carregandoSaldo = true;
  erro = '';
  showPrivateKey = false;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private walletService: WalletService,
    @Inject(DOCUMENT) private document: Document
  ) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const address = params['address'];
      if (address) {
        this.carregarDetalhesCarteira(address);
      } else {
        this.erro = 'Endereço da carteira não fornecido';
        this.carregandoCarteira = false;
      }
    });
  }
  
  carregarDetalhesCarteira(address: string): void {
    this.walletService.getWallet(address).subscribe({
      next: (data) => {
        this.carteira = data;
        this.carregandoCarteira = false;
        
        // Use name property if available, or fallback to address
        this.nomeCarteira = data.name || data.tipo || 'Carteira ' + data.address.substring(0, 8);
        this.endereco = data.address;
        
        this.carregarTransacoes(address);
        this.carregarUTXOs(address);
        this.carregarSaldo(address);
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da carteira:', err);
        this.erro = 'Erro ao carregar detalhes da carteira. Verifique se o servidor está rodando.';
        this.carregandoCarteira = false;
      }
    });
  }
  
  carregarTransacoes(address: string): void {
    this.walletService.getTransactions(address).subscribe({
      next: (data) => {
        this.transacoes = data;
        this.carregandoTransacoes = false;
      },
      error: (err) => {
        console.error('Erro ao carregar transações:', err);
        this.carregandoTransacoes = false;
      }
    });
  }
  
  carregarUTXOs(address: string): void {
    console.log('Carregando UTXOs para endereço:', address);
    this.walletService.getUtxos(address).subscribe({
      next: (data) => {
        console.log('Dados de UTXOs recebidos:', data);
        
        let utxoArray: any[] = [];
        
        if (Array.isArray(data)) {
          utxoArray = data;
        } else if (data && typeof data === 'object') {
          // Type assertion to access potential properties
          const dataObj = data as Record<string, any>;
          if (Array.isArray(dataObj['utxos'])) {
            utxoArray = dataObj['utxos'];
          } else if (Array.isArray(dataObj['result'])) {
            utxoArray = dataObj['result'];
          }
        }
        
        // Use our common helper method to process UTXOs
        this.processUTXOs(utxoArray);
        this.carregandoUTXOs = false;
      },
      error: (err) => {
        console.error('Erro ao carregar UTXOs:', err);
        this.carregandoUTXOs = false;
      }
    });
  }
  
  carregarSaldo(address: string): void {
    console.log('Carregando saldo para endereço:', address);
    this.walletService.getBalance(address).subscribe({
      next: (data) => {
        console.log('Dados de saldo recebidos:', data);
        let confirmedBalance = 0;
        
        if (data) {
          if (typeof data === 'number') {
            confirmedBalance = data;
          } else if (typeof data === 'object') {
            if (typeof data.confirmed === 'number') {
              confirmedBalance = data.confirmed;
            } else if (typeof data.balance === 'number') {
              confirmedBalance = data.balance;
            } else if (typeof data.result === 'number') {
              confirmedBalance = data.result;
            }
            
            if (Array.isArray(data.utxos) && data.utxos.length > 0) {
              console.log('UTXOs encontrados na resposta de saldo:', data.utxos);
              this.processUTXOs(data.utxos);
              this.carregandoUTXOs = false; // No need to make a separate call for UTXOs
            }
          }
        }
        
        const balanceBTC = confirmedBalance / 100000000;
        this.saldoAtual = balanceBTC;
        this.saldo = balanceBTC;
        console.log('Saldo em satoshis:', confirmedBalance);
        console.log('Saldo convertido para BTC:', balanceBTC);
        
        this.carregandoSaldo = false;
      },
      error: (err) => {
        console.error('Erro ao carregar saldo:', err);
        this.carregandoSaldo = false;
      }
    });
  }
  
  private processUTXOs(utxoArray: any[]): void {
    if (utxoArray && utxoArray.length > 0) {
      this.utxos = utxoArray.map(utxo => {
        const processedUtxo: any = { ...utxo };
        
        if (!processedUtxo.txid && processedUtxo.tx_hash) {
          processedUtxo.txid = processedUtxo.tx_hash;
        }
        
        if (typeof processedUtxo.vout !== 'number' && typeof processedUtxo.output_index === 'number') {
          processedUtxo.vout = processedUtxo.output_index;
        }
        
        if (typeof processedUtxo.amount === 'number') {
          processedUtxo.amount = processedUtxo.amount / 100000000;
        } else if (typeof processedUtxo.value === 'number') {
          processedUtxo.amount = processedUtxo.value / 100000000;
        } else {
          processedUtxo.amount = 0;
        }
        
        if (typeof processedUtxo.confirmations !== 'number') {
          processedUtxo.confirmations = 0;
        }
        
        if (typeof processedUtxo.spendable !== 'boolean') {
          processedUtxo.spendable = processedUtxo.confirmations > 0;
        }
        
        return processedUtxo;
      });
      
      console.log('UTXOs processados:', this.utxos);
    } else {
      this.utxos = [];
      console.log('UTXOs não disponíveis ou formato inválido, definido como array vazio');
    }
  }
  
  voltarParaCarteiras(): void {
    this.router.navigate(['/carteira']);
  }
  
  exportarCarteira(): void {
    if (this.carteira) {
      this.router.navigate(['/exportar-carteira'], { 
        state: { 
          walletData: {
            private_key: this.carteira.private_key,
            public_key: this.carteira.public_key,
            address: this.carteira.address,
            network: this.carteira.network,
            key_format: this.carteira.format
          } 
        } 
      });
    }
  }
  
  formatBtcValue(satoshis: number | undefined | null): string {
    if (satoshis === undefined || satoshis === null || isNaN(satoshis)) {
      return '0.00000000';
    }
    return satoshis.toFixed(8);
  }
  
  /**
   * @param inputElement O elemento input que contém o texto a ser copiado
   */
  copiarTexto(input: HTMLInputElement): void {
    input.select();
    this.document.execCommand('copy');
    input.setSelectionRange(0, 0);
    
    // Mostrar notificação de cópia
    const tooltip = document.createElement('div');
    tooltip.textContent = 'Copiado!';
    tooltip.className = 'copied-tooltip';
    input.parentNode?.appendChild(tooltip);
    
    setTimeout(() => {
      tooltip.remove();
    }, 2000);
  }

  togglePrivateKeyVisibility(input: HTMLInputElement): void {
    const icon = input.nextElementSibling?.nextElementSibling?.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('bi-eye-slash');
        icon.classList.add('bi-eye');
      }
    }
  }
}
