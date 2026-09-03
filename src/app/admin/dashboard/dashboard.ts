import { Component, OnInit, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TrabalhosService, TrabalhoAcademico, AdminStats, PaginatedTrabalhos } from '../../trabalhos.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly service = inject(TrabalhosService);
  private readonly router = inject(Router);

  readonly stats = signal<AdminStats>({ totalTrabalhos: 0, totalVisualizacoes: 0, totalDownloads: 0 });
  readonly trabalhos = signal<TrabalhoAcademico[]>([]);
  readonly filteredTrabalhos = signal<TrabalhoAcademico[]>([]);
  readonly loading = signal(true);
  readonly searchQuery = signal('');

  // Seleção em lote
  readonly idsSelecionados = signal<string[]>([]);
  readonly todosSelecionados = signal(false);

  ngOnInit(): void {
    this.service.getStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Stats error:', err),
    });

    // Carrega primeira página (até 1000 itens para o dashboard corporativo)
    this.service.getTrabalhos(1, 1000).subscribe({
      next: (res: PaginatedTrabalhos) => {
        this.trabalhos.set(res.data);
        this.filteredTrabalhos.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading trabalhos:', err);
        this.loading.set(false);
      },
    });
  }

  onSearch(event: Event): void {
    const q = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchQuery.set(q);
    if (!q) {
      this.filteredTrabalhos.set(this.trabalhos());
    } else {
      this.filteredTrabalhos.set(
        this.trabalhos().filter(t =>
          t.titulo.toLowerCase().includes(q) || t.autor.toLowerCase().includes(q)
        )
      );
    }
  }

  deletar(id: string, titulo: string): void {
    if (!confirm(`Tem certeza que deseja excluir "${titulo}"?`)) return;
    this.service.deletarTrabalho(id).subscribe({
      next: () => {
        this.trabalhos.update(list => list.filter(t => t.id !== id));
        this.filteredTrabalhos.update(list => list.filter(t => t.id !== id));
        this.stats.update(s => ({ ...s, totalTrabalhos: s.totalTrabalhos - 1 }));
      },
      error: (err) => console.error('Delete error:', err),
    });
  }

  logout(): void {
    localStorage.removeItem('admin_token');
    this.router.navigate(['/admin/login']);
  }

  // --- Lógica de Seleção ---

  toggleSelecao(id: string): void {
    this.idsSelecionados.update(ids => 
      ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]
    );
    this.atualizarStatusTodos();
  }

  toggleSelecaoTodos(): void {
    const novoStatus = !this.todosSelecionados();
    this.todosSelecionados.set(novoStatus);
    
    if (novoStatus) {
      const todosIds = this.filteredTrabalhos().map(t => t.id);
      this.idsSelecionados.set(todosIds);
    } else {
      this.idsSelecionados.set([]);
    }
  }

  private atualizarStatusTodos(): void {
    const atuais = this.filteredTrabalhos();
    if (atuais.length === 0) {
      this.todosSelecionados.set(false);
      return;
    }
    this.todosSelecionados.set(atuais.every(t => this.idsSelecionados().includes(t.id)));
  }

  confirmarExclusaoLote(): void {
    const ids = this.idsSelecionados();
    if (ids.length === 0) return;

    if (!confirm(`Tem certeza que deseja excluir ${ids.length} trabalhos selecionados? Esta ação é irreversível.`)) return;

    this.service.excluirTrabalhosEmLote(ids).subscribe({
      next: () => {
        // Atualiza listas locais
        this.trabalhos.update(list => list.filter(t => !ids.includes(t.id)));
        this.filteredTrabalhos.update(list => list.filter(t => !ids.includes(t.id)));
        
        // Atualiza stats
        this.stats.update(s => ({ ...s, totalTrabalhos: s.totalTrabalhos - ids.length }));
        
        // Limpa seleção
        this.idsSelecionados.set([]);
        this.todosSelecionados.set(false);
      },
      error: (err) => {
        console.error('Batch delete error:', err);
        alert('Erro ao excluir trabalhos em lote.');
      }
    });
  }
}
