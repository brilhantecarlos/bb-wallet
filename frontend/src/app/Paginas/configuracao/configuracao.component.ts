import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../Componentes/sidebar/sidebar.component';
import { HeaderComponent } from '../../Componentes/header/header.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, FormsModule],
  templateUrl: './configuracao.component.html',
  styleUrls: ['./configuracao.component.css']
})
export class ConfiguracaoComponent {
  idioma: string = 'pt';
  endereco: string = '127.0.0.1';
  porta: number = 8332;

  salvarConfiguracoes() {
    // Aqui você pode adicionar lógica para salvar no localStorage, enviar para API, etc.
    console.log('Configurações salvas:', {
      idioma: this.idioma,
      endereco: this.endereco,
      porta: this.porta
    });
    alert('Configurações salvas com sucesso!');
  }
}
