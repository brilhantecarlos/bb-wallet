import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-importar-carteira',
  imports: [CommonModule, HeaderComponent, FormsModule],
  templateUrl: './importar-carteira.component.html',
  styleUrls: ['./importar-carteira.component.css']
})
export class ImportarCarteiraComponent {
  chavePrivada: string = '';

  importarCarteira() {
    console.log('Chave importada:', this.chavePrivada);
  }
}
