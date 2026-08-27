import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly apiUrl = `${environment.apiUrl}/users`;
  private readonly authUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  registerSubadmin(data: any): Observable<User> {
    return this.http.post<User>(`${this.authUrl}/register-subadmin`, data);
  }

  toggleUserStatus(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  deleteUser(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.apiUrl}/${id}`);
  }
}
