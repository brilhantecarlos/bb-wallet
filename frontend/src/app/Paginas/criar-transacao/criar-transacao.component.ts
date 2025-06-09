import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletService } from '../../Service/wallet.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-criar-transacao',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, FormsModule],
  templateUrl: './criar-transacao.component.html',
  styleUrls: ['./criar-transacao.component.css']
})
export class CriarTransacaoComponent implements OnInit {
  origem: string = '';
  destino: string = '';
  taxa: string = 'automatica';
  valor: number = 0;
  enviandoTransacao: boolean = false;
  errorMessage: string = '';
  
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private walletService: WalletService
  ) {}

  get taxaCalculada(): string {
    let feeRate: number;
    switch (this.taxa) {
      case 'baixa':
        feeRate = 1;
        break;
      case 'media':
        feeRate = 2;
        break;
      default: 
        feeRate = 3;
        break;
    }
    
    const estimatedSize = 226;
    
    const feeInSatoshis = estimatedSize * feeRate;
    
    const feeInBtc = feeInSatoshis / 100000000;
    
    return feeInBtc.toFixed(8) + ' BTC';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['address']) {
        this.origem = params['address'];
      }
    });
  }

  cancelar() {
    this.router.navigate(['/painel']);
  }

  enviar() {
    if (!this.origem || !this.destino || this.valor <= 0) {
      this.errorMessage = 'Por favor, preencha todos os campos corretamente.';
      return;
    }
    
    this.enviandoTransacao = true;
    this.errorMessage = '';
    
    this.walletService.getBalance(this.origem).subscribe({
      next: (balanceResponse) => {
        console.log('Verificando saldo:', balanceResponse);
        
        const balanceData = balanceResponse.balance || balanceResponse;
        let availableBalance = 0;
        
        if (typeof balanceData === 'number') {
          availableBalance = balanceData;
        } else if (balanceData.confirmed !== undefined) {
          availableBalance = balanceData.confirmed;
        }
        
        const amountInSatoshis = this.valor * 100000000;
        
        if (availableBalance < amountInSatoshis) {
          this.enviandoTransacao = false;
          this.errorMessage = `Saldo insuficiente. Disponível: ${availableBalance / 100000000} BTC, Necessário: ${this.valor} BTC`;
          return;
        }
        
        let feeRate: number;
        switch (this.taxa) {
          case 'baixa': feeRate = 1; break;
          case 'media': feeRate = 2; break;
          default: feeRate = 3; break;
        }
        
        const transactionData = {
          fromAddress: this.origem,
          toAddress: this.destino,
          amount: amountInSatoshis,
          feeRate: feeRate
        };
        
        console.log('Enviando transação:', transactionData);
        
        this.walletService.createTransaction(transactionData).subscribe({
          next: (response) => {
            console.log('Transação criada com sucesso:', response);
            this.enviandoTransacao = false;
            alert('Transação enviada com sucesso!');
            this.router.navigate(['/painel']);
          },
          error: (error) => {
            console.error('Erro ao criar transação:', error);
            this.enviandoTransacao = false;
            
            if (error.status === 422) {
              this.errorMessage = 'Erro ao criar transação: Carteira sem fundos suficientes ou UTXOs disponíveis.';
            } else {
              this.errorMessage = 'Erro ao criar transação: ' + 
                (error.error?.message || error.message || 'Erro desconhecido');
            }
          }
        });
      },
      error: (error) => {
        console.error('Erro ao verificar saldo:', error);
        this.enviandoTransacao = false;
        this.errorMessage = 'Erro ao verificar saldo da carteira. Verifique o endereço de origem.';
      }
    });
  }
}
