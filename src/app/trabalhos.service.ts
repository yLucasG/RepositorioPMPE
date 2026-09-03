import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

export const LINHAS_PESQUISA: string[] = [
  "1. Cenários Estratégicos, Cultura e Doutrina PM",
  "2. Políticas Públicas e Gestão de Segurança Pública",
  "3. Estratégias de Policiamento e Prevenção à Criminalidade",
  "4. Violência Social e Criminalidade",
  "5. Educação Policial, Ensino e Instrução Policial Militar",
  "6. Polícia, Direitos Humanos e Cidadania",
  "7. Administração Estratégica",
  "8. Gestão de Pessoas, Logística e Finanças Públicas",
  "9. Saúde e Qualidade de Vida do Policial Militar",
  "10. Inovação e Tecnologias em Segurança Pública"
];

export const TIPOS_TRABALHO: string[] = [
  "TCC",
  "Artigo",
  "Monografia",
  "Dissertação",
  "Tese",
];

export interface TrabalhoAcademico {
  id: string;
  titulo: string;
  autor: string;
  resumo: string;
  ano: number;
  categoria: string;
  tipo: string;
  url_arquivo: string;
  referencias: string[];
  visualizacoes: number;
  downloads: number;
}

export interface AdminStats {
  totalTrabalhos: number;
  totalVisualizacoes: number;
  totalDownloads: number;
}

export interface IAExtracao {
  titulo: string;
  autores: string;
  resumo: string;
  referencias: string;
  tema: string;
  tipo: string;
  ano: number;
}

export interface PaginatedTrabalhos {
  data: TrabalhoAcademico[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TrabalhosService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = '/api';

  getTrabalhos(page: number = 1, limit: number = 10): Observable<PaginatedTrabalhos> {
    return this.http.get<PaginatedTrabalhos>(`${this.API_URL}/trabalhos?page=${page}&limit=${limit}`);
  }

  getTrabalhoPorId(id: string): Observable<TrabalhoAcademico> {
    return this.http.get<TrabalhoAcademico>(`${this.API_URL}/trabalhos/${id}`);
  }

  registrarDownload(id: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/trabalhos/${id}/download`, {});
  }

  criarTrabalho(data: Partial<TrabalhoAcademico>): Observable<TrabalhoAcademico> {
    return this.http.post<TrabalhoAcademico>(`${this.API_URL}/trabalhos`, data);
  }

  atualizarTrabalho(id: string, data: Partial<TrabalhoAcademico>): Observable<TrabalhoAcademico> {
    return this.http.put<TrabalhoAcademico>(`${this.API_URL}/trabalhos/${id}`, data);
  }

  deletarTrabalho(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.API_URL}/trabalhos/${id}`);
  }

  excluirTrabalhosEmLote(ids: string[]): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.API_URL}/trabalhos/lote/delete`, { ids });
  }

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.API_URL}/admin/stats`);
  }

  login(usuario: string, senha: string): Observable<{ success: boolean; token: string; user: { id: string; usuario: string } }> {
    return this.http.post<{ success: boolean; token: string; user: { id: string; usuario: string } }>(`${this.API_URL}/admin/login`, { usuario, senha });
  }

  extrairDadosIA(file: File): Observable<{ success: boolean; data: IAExtracao }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ success: boolean; data: IAExtracao }>(`${this.API_URL}/ia/extrair-dados`, formData);
  }

  async uploadArquivo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const { url } = await firstValueFrom(this.http.post<{ url: string }>(`${this.API_URL}/admin/upload`, formData));
    return url;
  }
}
