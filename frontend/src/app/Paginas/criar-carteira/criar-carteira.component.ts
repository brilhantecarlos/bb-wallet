import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';
import { WalletService, Wallet } from '../../Service/wallet.service';

@Component({
  selector: 'app-criar-carteira',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, FormsModule],
  templateUrl: './criar-carteira.component.html',
  styleUrls: ['./criar-carteira.component.css']
})
export class CriarCarteiraComponent {
  nomeCarteira: string = '';
  method: string = 'entropy';
  network: string = 'testnet';
  keyFormat: string = 'p2pkh';

  createdWalletData: any = null;
  salvandoLocalmente = false;
  erroDeSalvamento = '';

  constructor(private router: Router, private http: HttpClient, private walletService: WalletService) {}

  voltar() {
    this.router.navigate(['/carteira']);
  }

  criarCarteira() {
    if (!this.nomeCarteira.trim()) {
      alert('Por favor, informe o nome da carteira.');
      return;
    }

    let payload: any = {
      method: this.method,
      network: this.network,
      key_format: this.keyFormat
    };

    if (this.method === 'bip39') {
      payload.mnemonic = null;
    }
    else if (this.method === 'bip32') {
      payload.derivation_path = "m/44'/0'/0'/0/0";
    }

    this.http.post<any>('http://127.0.0.1:8000/api/keys', payload)
      .subscribe({
        next: (response) => {
          if (response && response.address && response.private_key && response.public_key) {
            this.createdWalletData = response;
            
            this.createdWalletData.name = this.nomeCarteira;
            
            this.salvarCarteira(this.createdWalletData);
          } else {
            console.error('Resposta inesperada:', response);
            alert('Resposta inesperada do servidor ao criar carteira.');
          }
        },
        error: (error) => {
          console.error('Erro ao criar carteira:', error);
          let errorMessage = 'Erro ao criar carteira. Tente novamente.';
          
          if (error.error && error.error.detail) {
            errorMessage += `\n\nDetalhes: ${error.error.detail}`;
          }
          
          alert(errorMessage);
        }
      });
  }
  
  salvarCarteira(walletData: any) {
    this.salvandoLocalmente = true;
    this.erroDeSalvamento = '';
    
    const walletLocal: Wallet = {
      name: this.nomeCarteira,
      address: walletData.address,
      private_key: walletData.private_key, // Incluindo a chave privada
      public_key: walletData.public_key,
      format: walletData.format,
      network: walletData.network,
      key_generation_method: this.method, // Include the key generation method
      derivation_path: walletData.derivation_path,
      mnemonic: walletData.mnemonic
    };
    
    this.walletService.saveWallet(walletLocal).subscribe({
      next: (result) => {
        this.salvandoLocalmente = false;
        alert(`Carteira "${this.nomeCarteira}" criada e salva localmente com sucesso!`);
        this.router.navigate(['/detalhes-carteira'], { queryParams: { address: walletData.address } });
      },
      error: (err) => {
        this.salvandoLocalmente = false;
        this.erroDeSalvamento = 'Erro ao salvar carteira localmente. Os dados da carteira foram gerados, mas não foram salvos no banco de dados local.';
        console.error('Erro ao salvar carteira localmente:', err);
        
        if (confirm('Ocorreu um erro ao salvar a carteira localmente. Deseja continuar para ver os detalhes da carteira?')) {
          this.router.navigate(['/detalhes-carteira'], { queryParams: { address: walletData.address } });
        }
      }
    });
  }
}
