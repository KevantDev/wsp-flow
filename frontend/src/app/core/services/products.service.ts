import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, Category } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly apiUrl = `${environment.apiUrl}/products`;
  private readonly catUrl = `${environment.apiUrl}/categories`;

  constructor(private http: HttpClient) {}

  getProducts(categoryId?: string, search?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId);
    if (search) params = params.set('search', search);
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(data: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, data);
  }

  updateProduct(id: string, data: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, data);
  }

  updateStock(id: string, stock: number): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}/stock`, { stock });
  }

  deleteProduct(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }

  // Categorías
  getCategories(onlyActive = false): Observable<Category[]> {
    const params = new HttpParams().set('onlyActive', onlyActive ? 'true' : 'false');
    return this.http.get<Category[]>(this.catUrl, { params });
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(this.catUrl, data);
  }

  downloadCatalogPdf(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/catalog/pdf`, { responseType: 'blob' });
  }

  regenerateCatalogPdf(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/catalog/generate-pdf`, {});
  }
}
