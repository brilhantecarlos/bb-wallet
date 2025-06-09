import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, tap, switchMap } from 'rxjs/operators';

export interface Wallet {
  id?: number;
  name: string;
  description?: string;
  address: string;
  private_key?: string;
  public_key?: string;
  key_type?: string;
  key_generation_method?: string; // 'entropy', 'bip39', or 'bip32'
  format?: string; 
  derivation_path?: string; 
  mnemonic?: string; 
  tipo?: string; 
  network: string;
  created_at?: string;
  updated_at?: string;
}

export interface UTXO {
  id?: number;
  wallet_id?: number;
  txid: string;
  vout: number;
  amount: number;
  scriptPubKey?: string;
  script_pubkey?: string;
  address?: string;
  confirmations?: number;
  spendable?: boolean;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  txid: string;
  amount: number;
  fee: number;
  type: string;
  status: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WalletService {
  private fullApiUrl: string;

  constructor(private http: HttpClient) { 
    // Safely get the API URL from window object or use default
    const apiUrl = typeof window !== 'undefined' ? 
      (window as any).env?.API_URL || 'http://localhost:8000' : 
      'http://localhost:8000';
    
    // Ensure the URL ends with a single slash
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    this.fullApiUrl = `${baseUrl}/api`;
    
    console.log('WalletService initialized with API URL:', this.fullApiUrl);
  }
  
  createTransaction(transactionData: {
    fromAddress: string;
    toAddress: string;
    amount: number; 
    feeRate: number;
  }): Observable<any> {
    const fromAddress = transactionData.fromAddress;
    const startTime = performance.now();
    
    console.log(`[TX_CREATE] Iniciando transação de ${fromAddress} para ${transactionData.toAddress}`);
    
    const txRequest = {
      from_address: fromAddress,
      outputs: [{
        address: transactionData.toAddress,
        value: Math.floor(transactionData.amount) 
      }],
      fee_rate: transactionData.feeRate
    };
    
    console.log('[TX_CREATE] Requisição formatada para tx/build:', txRequest);
    
    const httpOptions = {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    };
    
    return this.http.post(`${this.fullApiUrl}/tx/build`, txRequest, httpOptions).pipe(
      tap((buildResponse: any) => {
        const buildTime = ((performance.now() - startTime) / 1000).toFixed(3);
        console.log(`[TX_CREATE] Transação construída em ${buildTime}s:`, buildResponse);
        
        if (!buildResponse.raw_transaction) {
          throw new Error('A resposta do servidor não contém o campo raw_transaction necessário para broadcast');
        }
      }),
      switchMap((buildResponse: any) => {
        console.log('[TX_CREATE] Iniciando broadcast da transação...');
        return this.broadcastTransaction(buildResponse.raw_transaction).pipe(
          tap(broadcastResponse => {
            broadcastResponse.original_txid = buildResponse.txid;
            broadcastResponse.original_raw_tx = buildResponse.raw_transaction;
          })
        );
      }),
      tap((broadcastResponse: any) => {
        const totalTime = ((performance.now() - startTime) / 1000).toFixed(3);
        console.log(`[TX_CREATE] Fluxo completo da transação concluído em ${totalTime}s:`, broadcastResponse);
      }),
      retry({ count: 2, delay: (error, retryCount) => {
        const delay = Math.pow(2, retryCount) * 1000; 
        console.log(`[TX_CREATE] Erro, tentando novamente em ${delay/1000}s (tentativa ${retryCount})`);
        return timer(delay);
      }}),
      catchError((error) => {
        console.error('[TX_CREATE] Erro fatal no fluxo da transação:', error);
        return throwError(() => new Error(
          `Erro ao processar transação: ${error.error?.detail || error.message || 'Erro desconhecido'}`
        ));
      })
    );
  }
  
  broadcastTransaction(txHex: string): Observable<any> {
    console.log('[TX_BROADCAST] Preparando para transmitir transação...');
    
    if (!txHex || txHex.length < 20) {
      console.error('[TX_BROADCAST] Hex de transação inválido:', txHex);
      return throwError(() => new Error('Hex de transação inválido ou vazio'));
    }
    
    const broadcastRequest = {
      tx_hex: txHex
    };
    
    const httpOptions = {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000
    };
    
    return this.http.post(`${this.fullApiUrl}/broadcast`, broadcastRequest, httpOptions).pipe(
      tap((response: any) => {
        console.log('[TX_BROADCAST] Resposta do broadcast:', response);
        
        if (response.txid) {
          console.log(`[TX_BROADCAST] Transação transmitida com sucesso: ${response.txid}`);
          if (response.explorer_url) {
            console.log(`[TX_BROADCAST] Link para explorador: ${response.explorer_url}`);
          }
        }
      }),
      retry({ count: 2, delay: (error, retryCount) => {
        if (error.status === 400) {
          console.error('[TX_BROADCAST] Erro 400, não tentando novamente:', error);
          return throwError(() => error);
        }
        
        const delay = Math.pow(2, retryCount) * 2000; 
        console.log(`[TX_BROADCAST] Erro, tentando novamente em ${delay/1000}s (tentativa ${retryCount})`);
        return timer(delay);
      }}),
      catchError((error: HttpErrorResponse) => {
        console.error('[TX_BROADCAST] Erro no broadcast:', error);
        
        let errorMsg = 'Erro ao transmitir transação';
        if (error.error?.detail) {
          errorMsg += `: ${error.error.detail}`;
        } else if (error.message) {
          errorMsg += `: ${error.message}`;
        }
        
        if (error.status === 0) {
          errorMsg += ' - Erro de conexão ou timeout';
        }
        
        return throwError(() => new Error(errorMsg));
      })
    );
  }

  getWallets(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(`${this.fullApiUrl}/wallets`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getWallet(address: string): Observable<Wallet> {
    return this.http.get<Wallet>(`${this.fullApiUrl}/wallets/${address}`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  saveWallet(wallet: Wallet): Observable<Wallet> {
    return this.http.post<Wallet>(`${this.fullApiUrl}/wallets`, wallet)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteWallet(address: string): Observable<any> {
    return this.http.delete(`${this.fullApiUrl}/wallets/${address}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getTransactions(address: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.fullApiUrl}/wallets/${address}/transactions`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  getUtxos(address: string): Observable<UTXO[]> {
    console.log(`Requesting UTXOs for address: ${address}`);
    console.log(`Full API URL: ${this.fullApiUrl}/wallets/${address}/utxos`);
    return this.http.get<UTXO[]>(`${this.fullApiUrl}/wallets/${address}/utxos`)
      .pipe(
        tap((response: any) => {
          console.log('UTXO response:', response);
          if (!response || !Array.isArray(response)) {
            console.warn('Invalid UTXO response format. Expected array but got:', typeof response);
          } else if (response.length > 0) {
            console.log('First UTXO sample:', response[0]);
          }
        }),
        retry(1),
        catchError(this.handleError)
      );
  }

  getBalance(address: string): Observable<any> {
    console.log(`Requesting balance from: ${this.fullApiUrl}/balance/${address}`);
    return this.http.get<any>(`${this.fullApiUrl}/balance/${address}`)
      .pipe(
        tap((response: any) => {
          console.log('Balance response:', response);
          if (!response || 
              (typeof response !== 'object' && typeof response !== 'number') || 
              (typeof response === 'object' && 
               !response.confirmed && 
               !response.balance && 
               response.confirmed !== 0 && 
               response.balance !== 0)) {
            console.warn('Potentially invalid balance response format:', response);
          }
        }),
        retry(1),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';
    
    if (error.error && typeof error.error === 'object' && error.error.message) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message || 'Unknown error'}`;
      
      if (error.status === 400 && error.error && typeof error.error === 'object') {
        if (error.error.detail && error.error.detail.includes('bitcoinlib')) {
          errorMessage += '\nPossible bitcoinlib compatibility issue detected.';
        }
      }
    }
    
    console.error('HTTP Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
