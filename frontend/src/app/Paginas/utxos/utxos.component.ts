import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';

interface UTXO {
  txid: string;
  vout: number;
  value: number; 
  address: string;
  confirmations: number;
  script?: string;
  selected?: boolean;
}

@Component({
  selector: 'app-utxos',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent, FormsModule],
  templateUrl: './utxos.component.html',
  styleUrls: ['./utxos.component.css']
})
export class UtxosComponent implements OnInit {
  searchTerm: string = '';
  balance: number = 0; 
  errorMessage: string | null = null;
  address: string = '';

  utxos: UTXO[] = [];

  consultaFinalizada: boolean = false;

  ngOnInit(): void {
    this.consultaFinalizada = false;
    this.utxos = [];
    this.balance = 0;
  }

  calcularBalance(): void {
    const totalSatoshis = this.utxos.reduce((total, utxo) => total + utxo.value, 0);
    this.balance = totalSatoshis / 100000000; 
  }

  filteredUtxos(): UTXO[] {
    if (!this.searchTerm.trim()) return this.utxos;

    const termo = this.normalizeText(this.searchTerm);

    return this.utxos.filter(utxo =>
      Object.values(utxo).some(value =>
        (typeof value === 'string' || typeof value === 'number') &&
        this.normalizeText(value.toString()).includes(termo)
      )
    );
  }

  normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  consultarUTXOs() {
    if (!this.address.trim()) {
      this.errorMessage = 'Por favor, insira um endereço válido.';
      this.utxos = [];
      this.balance = 0;
      this.consultaFinalizada = true;
      return;
    }

    // Consultar os UTXOs via API
    fetch(`http://localhost:8000/api/wallets/${this.address}/utxos`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Falha ao obter UTXOs');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.length > 0) {
          this.utxos = data.map((utxo: any) => ({
            ...utxo,
            selected: false
          }));
          this.errorMessage = null;
        } else {
          this.utxos = [];
          this.errorMessage = 'Nenhum UTXO encontrado para este endereço.';
        }
        this.calcularBalance();
        this.consultaFinalizada = true;
      })
      .catch(error => {
        console.error('Erro ao consultar UTXOs:', error);
        this.utxos = [];
        this.errorMessage = 'Erro ao consultar UTXOs. Verifique se o servidor está rodando.';
        this.consultaFinalizada = true;
      });
  }

  resetarConsulta() {
    this.address = '';
    this.searchTerm = '';
    this.errorMessage = null;
    this.consultaFinalizada = false;
    this.utxos = [];
    this.balance = 0;
  }

  exportarUTXOs() {
    const dados = JSON.stringify(this.utxos, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'utxos.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  getSelectedUTXOs(): UTXO[] {
    return this.utxos.filter(u => u.selected);
  }
}
