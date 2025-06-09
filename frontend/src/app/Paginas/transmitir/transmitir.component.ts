import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http'; 
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';

@Component({
  selector: 'app-transmitir',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  templateUrl: './transmitir.component.html',
  styleUrls: ['./transmitir.component.css']
})
export class TransmitirComponent {
  txHexAssinada: string = '';
  taxaEstimativa: number | null = null;
  unidadeTaxa: string = '';
  mensagemTaxa: string = '';

  constructor(private http: HttpClient) {}

  transmitirTransacao() {
    const urlValidate = '/api/validate/';
    const urlBroadcast = '/api/broadcast/';
    const payload = { tx_hex: this.txHexAssinada, network: 'testnet' };

    this.http.post(urlValidate, payload).pipe(
      catchError(error => {
        console.error('Erro ao validar transação', error);
        if (error.status === 422) {
          alert('Erro genérico na validação da transação (422)');
        } else {
          alert('Erro desconhecido ao validar transação');
        }
        return throwError(() => error);
      })
    ).subscribe((validateResponse: any) => {
      if (validateResponse.is_valid) {
        this.http.post(urlBroadcast, payload).pipe(
          catchError(error => {
            console.error('Erro ao transmitir transação', error);
            switch (error.status) {
              case 422:
                alert('Erro genérico na transmissão da transação (422)');
                break;
              case 400:
                alert('Transação inválida ou rejeitada (400)');
                break;
              case 409:
                alert('Transação conflita com outra (double-spend) (409)');
                break;
              case 413:
                alert('Transação muito grande (413)');
                break;
              case 429:
                alert('Taxa muito baixa ou outras restrições (429)');
                break;
              case 503:
                alert('Serviço temporariamente indisponível (503)');
                break;
              default:
                alert('Erro desconhecido ao transmitir transação');
            }
            return throwError(() => error);
          })
        ).subscribe((broadcastResponse: any) => {
          alert(`Transação enviada com sucesso! TXID: ${broadcastResponse.txid}`);
          console.log('Explorer URL:', broadcastResponse.explorer_url);
          this.txHexAssinada = ''; 
        });
      } else {
        const issues = validateResponse.issues?.join(', ') || 'Problema desconhecido na validação.';
        alert(`Transação inválida: ${issues}`);
      }
    });
  }

  buscarEstimativaTaxa(priority: 'high' | 'medium' | 'low', network: 'mainnet' | 'testnet') {
    const url = '/api/fee/estimate';
    const params = new HttpParams()
      .set('priority', priority)
      .set('network', network);

    this.http.get<any>(url, { params }).pipe(
      catchError(error => {
        console.error('Erro ao buscar estimativa de taxa', error);
        if (error.status === 400) {
          this.mensagemTaxa = 'Requisição inválida para estimativa de taxa (400)';
        } else if (error.status === 422) {
          this.mensagemTaxa = 'Erro de validação na estimativa de taxa (422)';
        } else if (error.status === 500) {
          this.mensagemTaxa = 'Erro no servidor ao consultar estimativa de taxa (500)';
        } else {
          this.mensagemTaxa = 'Erro desconhecido ao buscar estimativa de taxa';
        }
        return throwError(() => error);
      })
    ).subscribe(response => {
      this.taxaEstimativa = response[priority];
      this.unidadeTaxa = response.unit;
      this.mensagemTaxa = `Estimativa de taxa para prioridade ${priority}: ${this.taxaEstimativa} ${this.unidadeTaxa}`;
      console.log('Estimativa de taxa:', response);
    });
  }
}
