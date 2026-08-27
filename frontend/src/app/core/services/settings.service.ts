import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CompanyConfig } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getConfig(): Observable<CompanyConfig> {
    return this.http.get<CompanyConfig>(this.apiUrl);
  }

  updateConfig(data: Partial<CompanyConfig>): Observable<CompanyConfig> {
    return this.http.put<CompanyConfig>(this.apiUrl, data);
  }
}
