import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-consulta-transacao',
  templateUrl: './consulta-transacao.component.html',
  styleUrls: ['./consulta-transacao.component.css']
})
export class ConsultaTransacaoComponent {
  txid: string = '';
  network: 'mainnet' | 'testnet' = 'testnet';
  resultado: any = null;
  erro: string = '';

  constructor(private http: HttpClient) {}

  consultarTransacao() {
    if (!this.txid || this.txid.length !== 64) {
      this.erro = 'Por favor, informe um txid válido com 64 caracteres';
      this.resultado = null;
      return;
    }

    const url = `http://bitcoin-wallet:8000/api/tx/${this.txid}?network=${this.network}`;

    this.http.get(url).subscribe({
      next: (data) => {
        this.resultado = data;
        this.erro = '';
      },
      error: (err) => {
        this.resultado = null;
        if (err.status === 404) {
          this.erro = 'Transação não encontrada';
        } else if (err.status === 400 || err.status === 422) {
          this.erro = 'Requisição inválida';
        } else {
          this.erro = 'Erro ao consultar status da transação';
        }
      }
    });
  }
}
