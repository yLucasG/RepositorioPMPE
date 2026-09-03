import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TrabalhosService, TrabalhoAcademico, PaginatedTrabalhos, LINHAS_PESQUISA, TIPOS_TRABALHO } from '../trabalhos.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class HomeComponent implements OnInit {
  private readonly trabalhosService = inject(TrabalhosService);

  readonly allTrabalhos = signal<TrabalhoAcademico[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly searchQuery = signal('');
  readonly selectedCategoria = signal('all');
  readonly selectedTipo = signal('all');
  readonly selectedAno = signal('all');
  readonly selectedAutor = signal('all');

  // Controle de Paginação
  readonly paginaAtual = signal(1);
  readonly totalPaginas = signal(1);
  readonly totalItems = signal(0);
  readonly itensPorPagina = 10;

  readonly categorias = signal(LINHAS_PESQUISA);
  readonly tipos = signal(TIPOS_TRABALHO);

  readonly anos = computed(() => {
    const anosSet = new Set<number>();
    this.allTrabalhos().forEach(t => {
      if (t.ano) anosSet.add(t.ano);
    });
    return Array.from(anosSet).sort((a, b) => b - a);
  });

  readonly autores = computed(() => {
    const autoresSet = new Set<string>();
    this.allTrabalhos().forEach(t => {
      if (t.autor) {
        t.autor.split(',').forEach(a => {
          const trimmed = a.trim();
          if (trimmed) autoresSet.add(this.toTitleCase(trimmed));
        });
      }
    });
    return Array.from(autoresSet).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredTrabalhos = computed(() => {
    let results = this.allTrabalhos();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategoria();
    const tipo = this.selectedTipo();
    const ano = this.selectedAno();
    const autor = this.selectedAutor();

    if (q) {
      results = results.filter(t =>
        t.titulo.toLowerCase().includes(q) ||
        t.resumo.toLowerCase().includes(q)
      );
    }
    if (cat !== 'all') {
      results = results.filter(t => t.categoria.trim() === cat);
    }
    if (tipo !== 'all') {
      results = results.filter(t => t.tipo === tipo);
    }
    if (ano !== 'all') {
      results = results.filter(t => t.ano === parseInt(ano, 10));
    }
    if (autor !== 'all') {
      results = results.filter(t =>
        t.autor.split(',').some(a => this.toTitleCase(a.trim()) === autor)
      );
    }
    return results;
  });

  ngOnInit(): void {
    this.carregarTrabalhos();
  }

  carregarTrabalhos(): void {
    this.loading.set(true);
    this.trabalhosService.getTrabalhos(this.paginaAtual(), this.itensPorPagina).subscribe({
      next: (res: PaginatedTrabalhos) => {
        this.allTrabalhos.set(res.data);
        this.totalPaginas.set(res.meta.totalPages);
        this.totalItems.set(res.meta.totalItems);
        this.loading.set(false);
        // Scroll para o topo ao mudar de página
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Erro ao carregar trabalhos:', err);
        this.error.set('Não foi possível carregar os trabalhos. Verifique se o servidor está rodando.');
        this.loading.set(false);
      },
    });
  }

  irParaPagina(novaPagina: number): void {
    if (novaPagina >= 1 && novaPagina <= this.totalPaginas()) {
      this.paginaAtual.set(novaPagina);
      this.carregarTrabalhos();
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onCategoriaChange(event: Event): void {
    this.selectedCategoria.set((event.target as HTMLSelectElement).value);
  }

  onTipoChange(event: Event): void {
    this.selectedTipo.set((event.target as HTMLSelectElement).value);
  }

  onAnoChange(event: Event): void {
    this.selectedAno.set((event.target as HTMLSelectElement).value);
  }

  onAutorChange(event: Event): void {
    this.selectedAutor.set((event.target as HTMLSelectElement).value);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.selectedCategoria.set('all');
    this.selectedTipo.set('all');
    this.selectedAno.set('all');
    this.selectedAutor.set('all');
  }

  private toTitleCase(str: string): string {
    return str.toLowerCase().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
