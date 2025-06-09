import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';  
import { Router } from '@angular/router';  
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-exportar-carteira',
  imports: [CommonModule, HeaderComponent, SidebarComponent, FormsModule],
  templateUrl: './exportar-carteira.component.html',
  styleUrls: ['./exportar-carteira.component.css']
})
export class ExportarCarteiraComponent implements OnInit {
  errorMessage: string = '';
  hasValidWallet: boolean = false;
  privateKey: string = '';
  publicKey: string = '';
  address: string = '';
  method: string = 'entropy';
  network: string = 'testnet';
  keyFormat: string = 'p2pkh';
  fileFormat: string = 'txt';
  exportPath: string = '';
  exportError: string = '';
  exporting: boolean = false;

  constructor(private http: HttpClient, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras.state && nav.extras.state['walletData']) {
      const walletData = nav.extras.state['walletData'];
      this.privateKey = walletData.private_key;
      this.publicKey = walletData.public_key;
      this.address = walletData.address;
      this.method = walletData.key_generation_method || walletData.method || 'entropy';
      this.network = walletData.network || this.network;
      this.keyFormat = walletData.key_format || this.keyFormat;
      this.hasValidWallet = true;
    } else {
      this.errorMessage = 'Nenhuma carteira disponível para exportar. Volte e crie uma carteira primeiro.';
    }
  }
  
  async ngOnInit() {
    if (!this.hasValidWallet) {
      this.router.navigate(['/criar-carteira']);
      return;
    }
    
    await this.exportarChave();
  }

  getMethodDisplayName(method: string): string {
    const methodMap: {[key: string]: string} = {
      'entropy': 'Entropia (Padrão)',
      'bip39': 'BIP39 (Frase Mnemônica)',
      'bip32': 'BIP32 (Derivação de Chave)',
    };
    return methodMap[method] || method.toUpperCase();
  }

  async copiarExportPath() {
    try {
      await navigator.clipboard.writeText(this.exportPath);
    } catch (err) {
      console.error('Erro ao copiar o caminho:', err);
    }
  }

  async exportarChave() {
    if (!this.hasValidWallet) return;

    this.exporting = true;
    this.exportError = '';
    
    try {
      const payload = {
        private_key: this.privateKey,
        public_key: this.publicKey,
        address: this.address,
        format: this.keyFormat,
        network: this.network,
        method: this.method,
        file_format: this.fileFormat
      };

      const response: any = await this.http.post('http://localhost:8000/api/keys/export-file', payload, { observe: 'response' }).toPromise();
      
      if (response.status === 200 && response.body?.file_path) {
        this.exportPath = response.body.file_path;
      } else {
        throw new Error(`Exportação concluída com status ${response.status}.`);
      }
    } catch (error: any) {
      console.error('Erro ao exportar carteira:', error);
      this.exportError = error.status === 422 
        ? 'Erro ao exportar: dados inválidos ou falha na exportação.'
        : 'Erro inesperado ao exportar a carteira. Tente novamente.';
    } finally {
      this.exporting = false;
    }
  }
  
  /**
   * Copia o texto de um input para a área de transferência
   * @param inputElement O elemento input que contém o texto a ser copiado
   */
  copiarTexto(inputElement: HTMLInputElement): void {
    if (inputElement && typeof document !== 'undefined') {
      inputElement.select();
      document.execCommand('copy');
      this.errorMessage = 'Copiado para a área de transferência!';
    }
  }

  voltar() {
    this.router.navigate(['/carteira']);
  }
}
